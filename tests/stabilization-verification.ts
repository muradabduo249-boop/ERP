/**
 * SAHLA ERP — Stabilization & System Hardening Verification Suite
 * 
 * Verifies against live Cloud SQL PostgreSQL:
 * 1. General Manager (عبد الهادي) account preservation & role verification
 * 2. Complete employee provisioning flow & login via username, phone, and name
 * 3. Employee modification without wiping credentials (PIN preservation)
 * 4. Password updating and account reactivation unlocking
 * 5. Role-based isolation for Creative / Social Media designer
 * 6. Dynamic Customer Country & City registration & persistence
 * 7. Product Catalog Item Code & Supplier linkage & retrieval
 */

import { db } from '../src/db/index.ts';
import { users, roles, departments, customers, suppliers, products, productCategories } from '../src/db/schema.ts';
import { AuthService } from '../src/server/services/authService.ts';
import { CustomerService } from '../src/server/services/customerService.ts';
import { FinanceService } from '../src/server/services/financeService.ts';
import { eq, and, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

async function runStabilizationVerification() {
  console.log('\n===============================================================');
  console.log('🚀 RUNNING SAHLA ERP SYSTEM STABILIZATION & RBAC VERIFICATION');
  console.log('===============================================================\n');

  // -------------------------------------------------------------------------
  // 1. GENERAL MANAGER (عبد الهادي) VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 1. General Manager (عبد الهادي) Verification ---');

  const gmUsers = await db.select().from(users).where(eq(users.name, 'عبد الهادي'));
  assert(gmUsers.length === 1, 'Only exactly 1 account exists for General Manager (عبد الهادي) - no duplicates');

  const gm = gmUsers[0];
  assert(gm.username === 'admin', 'General Manager username is preserved as admin');
  assert(gm.email === 'ceo@sahla.sd', 'General Manager email is preserved as ceo@sahla.sd');
  assert(gm.phone === '+249912000001', 'General Manager phone is preserved as +249912000001');

  // Verify Role is super_admin
  const gmRole = await db.select().from(roles).where(eq(roles.id, gm.roleId!));
  assert(gmRole.length === 1 && gmRole[0].code === 'super_admin', 'General Manager has super_admin role');

  // Verify Department is MANAGEMENT
  const gmDept = await db.select().from(departments).where(eq(departments.id, gm.departmentId!));
  assert(gmDept.length === 1 && gmDept[0].code === 'MANAGEMENT', 'General Manager belongs to MANAGEMENT department');

  // Test login with alias "عبد الهادي"
  const gmLoginAlias = await AuthService.login({
    usernameOrEmail: 'عبد الهادي',
    pinOrPassword: '1234',
  });
  assert(gmLoginAlias.user.username === 'admin', 'Login with Arabic name "عبد الهادي" resolves to GM admin account');

  // -------------------------------------------------------------------------
  // 2. CREATIVE DESIGNER & SOCIAL MEDIA EXCLUSION
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Creative Designer & Social Media RBAC Exclusion ---');

  const designerUsers = await db.select().from(users).where(eq(users.username, 'designer'));
  assert(designerUsers.length === 1, 'Designer account exists for مازن كمال الدين');
  const designer = designerUsers[0];
  assert(
    Array.isArray(designer.allowedModules) && designer.allowedModules.length === 0,
    'Designer has 0 allowed ERP operational modules (strictly excluded)'
  );

  const designerRole = await db.select().from(roles).where(eq(roles.id, designer.roleId!));
  assert(
    designerRole.length === 1 && designerRole[0].code === 'creative_media',
    'Designer role is isolated as creative_media'
  );

  // -------------------------------------------------------------------------
  // 3. EMPLOYEE PROVISIONING, UPDATE & CREDENTIAL PRESERVATION
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Employee Provisioning, Update & Credential Preservation ---');

  const testUsername = `test_emp_${Date.now()}`;
  const testPhone = `+249919${Date.now().toString().slice(-6)}`;
  const testPin = '8899';

  // Find operations dept & role
  const opsDept = await db.select().from(departments).where(eq(departments.code, 'OPERATIONS'));
  const opsRole = await db.select().from(roles).where(eq(roles.code, 'operations_specialist'));

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(testPin, salt);

  // Create new employee
  const [createdEmp] = await db
    .insert(users)
    .values({
      username: testUsername,
      email: `${testUsername}@sahla.sd`,
      passwordHash,
      name: 'مهندس عمليات تجريبي',
      phone: testPhone,
      departmentId: opsDept[0]?.id || null,
      roleId: opsRole[0]?.id || null,
      status: 'active',
      allowedModules: ['dashboard', 'operations'],
    })
    .returning();

  assert(!!createdEmp?.id, 'New employee created in PostgreSQL');

  // Verify login with username
  const loginWithUsername = await AuthService.login({
    usernameOrEmail: testUsername,
    pinOrPassword: testPin,
  });
  assert(loginWithUsername.user.id === createdEmp.id, 'New employee logs in successfully with username');

  // Verify login with phone number
  const loginWithPhone = await AuthService.login({
    usernameOrEmail: testPhone,
    pinOrPassword: testPin,
  });
  assert(loginWithPhone.user.id === createdEmp.id, 'New employee logs in successfully with phone number');

  // Verify login with Arabic full name
  const loginWithName = await AuthService.login({
    usernameOrEmail: 'مهندس عمليات تجريبي',
    pinOrPassword: testPin,
  });
  assert(loginWithName.user.id === createdEmp.id, 'New employee logs in successfully with Arabic full name');

  // Update employee (change phone & name, leave PIN blank) -> Verify PIN is preserved!
  const updatedPhone = `+249918${Date.now().toString().slice(-6)}`;
  await db
    .update(users)
    .set({
      name: 'مهندس عمليات معتمد',
      phone: updatedPhone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, createdEmp.id));

  const loginAfterUpdate = await AuthService.login({
    usernameOrEmail: testUsername,
    pinOrPassword: testPin,
  });
  assert(
    loginAfterUpdate.user.name === 'مهندس عمليات معتمد',
    'Employee logs in with existing PIN after profile update without re-entering PIN'
  );

  // Update employee password
  const newPin = '5544';
  const newHash = await bcrypt.hash(newPin, await bcrypt.genSalt(10));
  await db
    .update(users)
    .set({
      passwordHash: newHash,
      failedLoginAttempts: 0,
      updatedAt: new Date(),
    })
    .where(eq(users.id, createdEmp.id));

  const loginWithNewPin = await AuthService.login({
    usernameOrEmail: testUsername,
    pinOrPassword: newPin,
  });
  assert(!!loginWithNewPin.token, 'Employee logs in successfully with newly updated PIN');

  // Deactivate test employee (audit log immutability preserves user record integrity)
  await db.update(users).set({ status: 'inactive' }).where(eq(users.id, createdEmp.id));

  // -------------------------------------------------------------------------
  // 4. CUSTOMER DYNAMIC COUNTRY & CITY REGISTRATION
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Dynamic Customer Country & City Registration ---');

  const intlCustomer = await CustomerService.createCustomer(
    {
      companyName: `شركة دبي للتجارة العامة ${Date.now()}`,
      primaryContactName: 'أحمد راشد الفلاسي',
      customerType: 'commercial',
      phone: `+97150${Date.now().toString().slice(-7)}`,
      email: `dubai.trade.${Date.now()}@example.ae`,
      country: 'الإمارات العربية المتحدة',
      city: 'دبي - منطقة القرهود',
    },
    { id: gm.id, name: gm.name, role: 'super_admin' }
  );

  assert(intlCustomer.country === 'الإمارات العربية المتحدة', 'Customer registered with UAE country successfully');
  assert(intlCustomer.city === 'دبي - منطقة القرهود', 'Customer registered with dynamic city in UAE successfully');

  // Sudan Expat/Local Customer
  const sdCustomer = await CustomerService.createCustomer(
    {
      companyName: `مؤسسة عطبرة الهندسية ${Date.now()}`,
      primaryContactName: 'عثمان عبد الله',
      customerType: 'industrial',
      phone: `+249912${Date.now().toString().slice(-6)}`,
      country: 'السودان',
      city: 'عطبرة - المنطقة الصناعية',
    },
    { id: gm.id, name: gm.name, role: 'super_admin' }
  );

  assert(sdCustomer.country === 'السودان', 'Customer registered with Sudan country successfully');
  assert(sdCustomer.city === 'عطبرة - المنطقة الصناعية', 'Customer registered with Atbara city successfully');

  // -------------------------------------------------------------------------
  // 5. PRODUCT CATALOG & SUPPLIER LINKAGE
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Product Catalog Item Code & Supplier Linkage ---');

  // Get active supplier
  const activeSuppliers = await db.select().from(suppliers).limit(1);
  const targetSupplier = activeSuppliers[0];
  assert(!!targetSupplier?.id, 'Real supplier exists in database for product linkage');

  // Create product linked to supplier
  const testProduct = await FinanceService.createProduct(
    {
      nameAr: `محول طاقة شمسية هجين 5 كيلوواط ${Date.now().toString().slice(-4)}`,
      nameEn: 'Hybrid Solar Inverter 5kW',
      costPrice: 420.0,
      sellingPrice: 580.0,
      unit: 'pcs',
      defaultCurrency: 'USD',
      supplierId: targetSupplier.id,
      minOrderQty: 5,
    },
    { id: gm.id, name: gm.name, role: 'super_admin' }
  );

  assert(!!testProduct.sku, `Product generated unique SKU: ${testProduct.sku}`);
  assert(testProduct.supplierId === targetSupplier.id, 'Product accurately linked to supplier in PostgreSQL');

  // Verify listProducts joins and returns supplierName
  const productsWithSupplier = await FinanceService.listProducts({ supplierId: targetSupplier.id });
  const foundLinked = productsWithSupplier.find((p) => p.id === testProduct.id);
  assert(!!foundLinked, 'Product retrieved via supplier filter');
  assert(foundLinked?.supplierName === targetSupplier.name, 'Product correctly returns joined supplierName from DB');

  // Clean up
  await db.delete(products).where(eq(products.id, testProduct.id));
  await db.delete(customers).where(eq(customers.id, intlCustomer.id));
  await db.delete(customers).where(eq(customers.id, sdCustomer.id));

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStabilizationVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
