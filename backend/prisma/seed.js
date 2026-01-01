import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create system user for games created without authentication
    const systemUser = await prisma.user.upsert({
        where: { id: 'system' },
        update: {},
        create: {
            id: 'system',
            email: 'system@moviequiz.local',
            name: 'System',
        },
    });

    console.log('✅ System user created:', systemUser);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
