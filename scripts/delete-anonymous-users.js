/**
 * Script to delete all anonymous Firebase Auth users.
 *
 * Prerequisites:
 *   1. npm install firebase-admin   (in the scripts/ folder or project root)
 *   2. Download your Firebase service account key:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *      Save as `serviceAccountKey.json` next to this script (do NOT commit it to git!)
 *
 * Run:
 *   node scripts/delete-anonymous-users.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

async function deleteAllAnonymousUsers() {
    let totalDeleted = 0;
    let nextPageToken;

    console.log('🔍 Scanning Firebase Auth users...');

    do {
        const listResult = await admin.auth().listUsers(1000, nextPageToken);
        const anonymousUsers = listResult.users.filter(u => u.providerData.length === 0);

        if (anonymousUsers.length > 0) {
            const uids = anonymousUsers.map(u => u.uid);
            const deleteResult = await admin.auth().deleteUsers(uids);
            totalDeleted += deleteResult.successCount;
            if (deleteResult.failureCount > 0) {
                console.warn(`⚠️  ${deleteResult.failureCount} users failed to delete:`, deleteResult.errors);
            }
            console.log(`🗑️  Deleted ${deleteResult.successCount} anonymous users (batch)`);
        }

        nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    console.log(`\n✅ Done! Total anonymous users deleted: ${totalDeleted}`);
}

deleteAllAnonymousUsers().catch(console.error);
