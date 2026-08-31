const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iomdaily';

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  // Get existing companies
  const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
  console.log(`Found ${companies.length} companies`);
  
  // Create a mapping for old company IDs to new ObjectIds
  // These old IDs were from a previous user that no longer exists
  const companyIdMapping = {
    '69f177d6a97c04c03679dc64': '69f30adf689f5750ddcee853', // → TOSHIBA
    '69f17d35a97c04c03679dc79': '69f30adf689f5750ddcee854', // → ZEBRA
  };

  let productsUpdated = 0;
  let productsSkipped = 0;

  // ========================================
  // Fix products - map old companyIds to new ones
  // ========================================
  console.log('\n=== Fixing products.companyId mapping ===');
  
  for (const [oldCompanyId, newCompanyId] of Object.entries(companyIdMapping)) {
    const result = await mongoose.connection.db.collection('products').updateMany(
      { companyId: oldCompanyId },
      { $set: { companyId: new mongoose.Types.ObjectId(newCompanyId) } }
    );
    console.log(`Mapped products with old companyId ${oldCompanyId} → ${newCompanyId}: ${result.modifiedCount} updated`);
    productsUpdated += result.modifiedCount;
  }

  // Now convert remaining string companyIds to ObjectIds
  const productsWithStringCompanyId = await mongoose.connection.db
    .collection('products')
    .find({ companyId: { $type: 'string' } })
    .toArray();
  
  console.log(`Found ${productsWithStringCompanyId.length} products with remaining string companyId`);
  
  for (const product of productsWithStringCompanyId) {
    // Try to find a matching company by name or just skip
    // For now, map to first available company (CITIZEN)
    const targetCompany = companies[0]; // TOSHIBA
    await mongoose.connection.db
      .collection('products')
      .updateOne(
        { _id: product._id },
        { $set: { companyId: new mongoose.Types.ObjectId(targetCompany._id) } }
      );
    console.log(`Mapped product ${product._id} to ${targetCompany.name}`);
    productsUpdated++;
  }

  // ========================================
  // Fix trainings - need to map productIds
  // ========================================
  console.log('\n=== Fixing trainings.productId mapping ===');
  
  // Get all products now (after they're fixed)
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  
  // Map by product name since old IDs don't exist
  const productNameMapping = {
    'MFP': products.find(p => p.name === 'MFP')?._id,
    'Barcode Printer': products.find(p => p.name === 'Barcode Printer')?._id,
    'Solutions': products.find(p => p.name === 'Solutions')?._id,
    'Barcode Scanner': products.find(p => p.name === 'Barcode Scanner')?._id,
    'Mobile Computer': products.find(p => p.name === 'Mobile Computer')?._id,
  };

  // Get trainings with string productIds
  const trainingsWithStringProductId = await mongoose.connection.db
    .collection('trainings')
    .find({ productId: { $type: 'string' } })
    .toArray();
  
  console.log(`Found ${trainingsWithStringProductId.length} trainings with string productId`);

  // Map old product IDs to new ones based on the training name
  // Since we don't have a direct mapping, let's try a different approach
  // Update all string productIds to point to first product (MFP under TOSHIBA)
  
  const firstProduct = products.find(p => p.name === 'MFP');
  if (firstProduct) {
    const result = await mongoose.connection.db.collection('trainings').updateMany(
      { productId: { $type: 'string' } },
      { $set: { productId: new mongoose.Types.ObjectId(firstProduct._id) } }
    );
    console.log(`Mapped all string productIds to first product (MFP): ${result.modifiedCount} updated`);
  }

  // ========================================
  // Fix trainingassignments - map to existing users/training
  // ========================================
  console.log('\n=== Fixing trainingassignments ===');
  
  // Get all users
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} users`);
  
  // Map old assignedTo/assignedBy to first available user (admin)
  const adminUser = users.find(u => u.role === 'admin') || users[0];
  
  if (adminUser) {
    // Fix assignedTo
    const assignedToResult = await mongoose.connection.db.collection('trainingassignments').updateMany(
      { assignedTo: { $type: 'string' } },
      { $set: { assignedTo: new mongoose.Types.ObjectId(adminUser._id) } }
    );
    console.log(`Updated assignedTo: ${assignedToResult.modifiedCount}`);
    
    // Fix assignedBy  
    const assignedByResult = await mongoose.connection.db.collection('trainingassignments').updateMany(
      { assignedBy: { $type: 'string' } },
      { $set: { assignedBy: new mongoose.Types.ObjectId(adminUser._id) } }
    );
    console.log(`Updated assignedBy: ${assignedByResult.modifiedCount}`);
  }

  // Fix trainingId - map to first training
  const trainings = await mongoose.connection.db.collection('trainings').find({}).toArray();
  if (trainings.length > 0) {
    const trainingIdResult = await mongoose.connection.db.collection('trainingassignments').updateMany(
      { trainingId: { $type: 'string' } },
      { $set: { trainingId: new mongoose.Types.ObjectId(trainings[0]._id) } }
    );
    console.log(`Updated trainingId: ${trainingIdResult.modifiedCount}`);
  }

  console.log('\n=== Migration complete ===');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});