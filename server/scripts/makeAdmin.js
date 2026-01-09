import 'dotenv/config';
import mongoose from 'mongoose';

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: 'admin@robinnotes.com' },
            { $set: { role: 'admin', canUpload: true } }
        );

        console.log('Updated documents:', result.modifiedCount);

        // Also list all users
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('All users:');
        users.forEach(u => {
            console.log(`  - ${u.email}: role=${u.role}, canUpload=${u.canUpload}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

makeAdmin();
