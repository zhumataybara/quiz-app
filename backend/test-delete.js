import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting delete test...');

    // 1. Create a test game with all relations
    const game = await prisma.game.create({
        data: {
            title: 'Delete Test Game',
            roomCode: 'DELTEST',
            status: 'ACTIVE',
            creatorId: 'system',
            rounds: {
                create: {
                    title: 'Round 1',
                    orderIndex: 0,
                    state: 'ACTIVE',
                    questions: {
                        create: {
                            tmdbId: 100,
                            tmdbType: 'movie',
                            title: 'Test Movie',
                            orderIndex: 0
                        }
                    }
                }
            }
        },
        include: {
            rounds: true
        }
    });

    console.log(`Created game ${game.id} with round ${game.rounds[0].id}`);

    // 2. Set currentRoundId (cyclic dependency check)
    await prisma.game.update({
        where: { id: game.id },
        data: { currentRoundId: game.rounds[0].id }
    });
    console.log('Set currentRoundId');

    // 3. Add a player
    await prisma.player.create({
        data: {
            gameId: game.id,
            nickname: 'TestPlayer',
            socketId: 'socket123'
        }
    });
    console.log('Added player');

    // 4. Try to delete
    console.log('Attempting to delete game...');
    try {
        await prisma.game.delete({
            where: { id: game.id }
        });
        console.log('SUCCESS: Game deleted');
    } catch (error) {
        console.error('FAIL: Could not delete game');
        console.error(error);
    }

    // 5. Verify it's gone
    const check = await prisma.game.findUnique({ where: { id: game.id } });
    if (!check) {
        console.log('VERIFIED: Game record is gone');
    } else {
        console.log('ERROR: Game record still exists!');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
