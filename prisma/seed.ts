import bcrypt from "bcryptjs";
import {readFileSync} from "fs";
import {join} from "path";
import {prisma} from "../src/database";
import {CardModel} from "../src/generated/prisma/models/Card";
import {PokemonType} from "../src/generated/prisma/enums";

function getRandomCards(cards: CardModel[], count: number): CardModel[] {
    return [...cards]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
}

async function main() {
    console.log("🌱 Starting database seed...");

    await prisma.$executeRaw`TRUNCATE TABLE "DeckCard" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Deck" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Card" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;

    const hashedPassword = await bcrypt.hash("password123", 10);

    await prisma.user.createMany({
        data: [
            {
                username: "red",
                email: "red@example.com",
                password: hashedPassword,
            },
            {
                username: "blue",
                email: "blue@example.com",
                password: hashedPassword,
            },
        ],
    });

    const redUser = await prisma.user.findUnique({where: {email: "red@example.com"}});
    const blueUser = await prisma.user.findUnique({where: {email: "blue@example.com"}});

    if (!redUser || !blueUser) {
        throw new Error("Failed to create users");
    }

    console.log("✅ Created users:", redUser.username, blueUser.username);

    const pokemonDataPath = join(__dirname, "data", "pokemon.json");
    const pokemonJson = readFileSync(pokemonDataPath, "utf-8");
    const pokemonData: CardModel[] = JSON.parse(pokemonJson);

    const createdCards = await Promise.all(
        pokemonData.map((pokemon) =>
            prisma.card.create({
                data: {
                    name: pokemon.name,
                    hp: pokemon.hp,
                    attack: pokemon.attack,
                    type: PokemonType[pokemon.type as keyof typeof PokemonType],
                    pokedexNumber: pokemon.pokedexNumber,
                    imgUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedexNumber}.png`,
                },
            })
        )
    );

    console.log(`✅ Created ${pokemonData.length} Pokemon cards`);

    const users = [redUser, blueUser];

    for (const user of users) {
        const deck = await prisma.deck.create({
            data: {
                name: "Starter Deck",
                userId: user.id,
            },
        });

        const randomCards = getRandomCards(createdCards, 10);

        await prisma.deckCard.createMany({
            data: randomCards.map((card) => ({
                deckId: deck.id,
                cardId: card.id,
            })),
        });
    }

    console.log("Created started deck");


    console.log("\n🎉 Database seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
