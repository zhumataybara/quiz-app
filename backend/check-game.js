import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkGame() {
    try {
        const game = await prisma.game.findUnique({
            where: { id: 'cmjqzzjms005r132ukdq5mxek' }
        });
        console.log('Game status:', game?.status);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkGame();
