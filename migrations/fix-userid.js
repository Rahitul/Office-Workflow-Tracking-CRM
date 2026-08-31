const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iomdaily';

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  
  console.log('Finding activities with string userId...');
  
  const stringUserIdActivities = await mongoose.connection.db
    .collection('activities')
    .find({ userId: { $type: 'string' } })
    .toArray();
  
  console.log(`Found ${stringUserIdActivities.length} activities with string userId`);
  
  if (stringUserIdActivities.length === 0) {
    console.log('No activities need migration. Exiting.');
    process.exit(0);
  }
  
  let updated = 0;
  let skipped = 0;
  
  for (const activity of stringUserIdActivities) {
    try {
      const userExists = await mongoose.connection.db
        .collection('users')
        .findOne({ _id: new mongoose.Types.ObjectId(activity.userId) });
      
      if (userExists) {
        await mongoose.connection.db
          .collection('activities')
          .updateOne(
            { _id: activity._id },
            { $set: { userId: new mongoose.Types.ObjectId(activity.userId) } }
          );
        console.log(`Updated activity ${activity._id} - user ${activity.userId}`);
        updated++;
      } else {
        console.log(`Skipped activity ${activity._id} - user ${activity.userId} not found`);
        skipped++;
      }
    } catch (err) {
      console.log(`Error processing activity ${activity._id}: ${err.message}`);
      skipped++;
    }
  }
  
  console.log(`\nMigration complete: ${updated} updated, ${skipped} skipped`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});