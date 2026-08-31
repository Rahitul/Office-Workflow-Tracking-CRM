const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iomdaily';

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  let totalUpdated = 0;
  let totalSkipped = 0;

  // ========================================
  // 1. Fix products.companyId (string → ObjectId)
  // ========================================
  console.log('\n=== Fixing products.companyId ===');
  const products = await mongoose.connection.db
    .collection('products')
    .find({ companyId: { $type: 'string' } })
    .toArray();

  console.log(`Found ${products.length} products with string companyId`);
  
  for (const product of products) {
    try {
      const companyExists = await mongoose.connection.db
        .collection('companies')
        .findOne({ _id: new mongoose.Types.ObjectId(product.companyId) });

      if (companyExists) {
        await mongoose.connection.db
          .collection('products')
          .updateOne(
            { _id: product._id },
            { $set: { companyId: new mongoose.Types.ObjectId(product.companyId) } }
          );
        console.log(`Updated product ${product._id}`);
        totalUpdated++;
      } else {
        console.log(`Skipped product ${product._id} - company not found`);
        totalSkipped++;
      }
    } catch (err) {
      console.log(`Error processing product ${product._id}: ${err.message}`);
      totalSkipped++;
    }
  }

  // ========================================
  // 2. Fix trainings.productId (string → ObjectId)
  // ========================================
  console.log('\n=== Fixing trainings.productId ===');
  const trainings = await mongoose.connection.db
    .collection('trainings')
    .find({ productId: { $type: 'string' } })
    .toArray();

  console.log(`Found ${trainings.length} trainings with string productId`);
  
  for (const training of trainings) {
    try {
      const productExists = await mongoose.connection.db
        .collection('products')
        .findOne({ _id: new mongoose.Types.ObjectId(training.productId) });

      if (productExists) {
        await mongoose.connection.db
          .collection('trainings')
          .updateOne(
            { _id: training._id },
            { $set: { productId: new mongoose.Types.ObjectId(training.productId) } }
          );
        console.log(`Updated training ${training._id}`);
        totalUpdated++;
      } else {
        console.log(`Skipped training ${training._id} - product not found`);
        totalSkipped++;
      }
    } catch (err) {
      console.log(`Error processing training ${training._id}: ${err.message}`);
      totalSkipped++;
    }
  }

  // ========================================
  // 3. Fix trainingassignments references
  // ========================================
  console.log('\n=== Fixing trainingassignments ===');
  
  // Fix trainingId
  const assignmentsWithStringTrainingId = await mongoose.connection.db
    .collection('trainingassignments')
    .find({ trainingId: { $type: 'string' } })
    .toArray();

  console.log(`Found ${assignmentsWithStringTrainingId.length} assignments with string trainingId`);
  
  for (const assignment of assignmentsWithStringTrainingId) {
    try {
      const trainingExists = await mongoose.connection.db
        .collection('trainings')
        .findOne({ _id: new mongoose.Types.ObjectId(assignment.trainingId) });

      if (trainingExists) {
        await mongoose.connection.db
          .collection('trainingassignments')
          .updateOne(
            { _id: assignment._id },
            { $set: { trainingId: new mongoose.Types.ObjectId(assignment.trainingId) } }
          );
        console.log(`Updated assignment ${assignment._id} - trainingId`);
        totalUpdated++;
      } else {
        console.log(`Skipped assignment ${assignment._id} - training not found`);
        totalSkipped++;
      }
    } catch (err) {
      console.log(`Error processing assignment ${assignment._id}: ${err.message}`);
      totalSkipped++;
    }
  }

  // Fix assignedTo
  const assignmentsWithStringAssignedTo = await mongoose.connection.db
    .collection('trainingassignments')
    .find({ assignedTo: { $type: 'string' } })
    .toArray();

  console.log(`Found ${assignmentsWithStringAssignedTo.length} assignments with string assignedTo`);
  
  for (const assignment of assignmentsWithStringAssignedTo) {
    try {
      const userExists = await mongoose.connection.db
        .collection('users')
        .findOne({ _id: new mongoose.Types.ObjectId(assignment.assignedTo) });

      if (userExists) {
        await mongoose.connection.db
          .collection('trainingassignments')
          .updateOne(
            { _id: assignment._id },
            { $set: { assignedTo: new mongoose.Types.ObjectId(assignment.assignedTo) } }
          );
        console.log(`Updated assignment ${assignment._id} - assignedTo`);
        totalUpdated++;
      } else {
        console.log(`Skipped assignment ${assignment._id} - user not found`);
        totalSkipped++;
      }
    } catch (err) {
      console.log(`Error processing assignment ${assignment._id}: ${err.message}`);
      totalSkipped++;
    }
  }

  // Fix assignedBy
  const assignmentsWithStringAssignedBy = await mongoose.connection.db
    .collection('trainingassignments')
    .find({ assignedBy: { $type: 'string' } })
    .toArray();

  console.log(`Found ${assignmentsWithStringAssignedBy.length} assignments with string assignedBy`);
  
  for (const assignment of assignmentsWithStringAssignedBy) {
    try {
      const userExists = await mongoose.connection.db
        .collection('users')
        .findOne({ _id: new mongoose.Types.ObjectId(assignment.assignedBy) });

      if (userExists) {
        await mongoose.connection.db
          .collection('trainingassignments')
          .updateOne(
            { _id: assignment._id },
            { $set: { assignedBy: new mongoose.Types.ObjectId(assignment.assignedBy) } }
          );
        console.log(`Updated assignment ${assignment._id} - assignedBy`);
        totalUpdated++;
      } else {
        console.log(`Skipped assignment ${assignment._id} - user not found`);
        totalSkipped++;
      }
    } catch (err) {
      console.log(`Error processing assignment ${assignment._id}: ${err.message}`);
      totalSkipped++;
    }
  }

  console.log(`\n=== Migration complete: ${totalUpdated} updated, ${totalSkipped} skipped ===`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});