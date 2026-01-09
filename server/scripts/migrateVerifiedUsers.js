// Migration script to verify existing users
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrateExistingUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all users that don't have isVerified field
        const result = await mongoose.connection.db.collection('users').updateMany(
            { isVerified: { $exists: false } },
            { $set: { isVerified: true } }
        );

        console.log(`Updated ${result.modifiedCount} users to verified status`);

        // Also update users where isVerified is false but they existed before this feature
        const result2 = await mongoose.connection.db.collection('users').updateMany(
            { isVerified: false },
            { $set: { isVerified: true } }
        );

        console.log(`Updated ${result2.modifiedCount} additional users`);

        await mongoose.disconnect();
        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateExistingUsers();
