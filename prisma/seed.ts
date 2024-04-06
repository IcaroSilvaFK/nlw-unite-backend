import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()


const attendees = Array.from({ length: 120 }).map(() => ({
  email: faker.internet.email(),
  name: faker.internet.userName(),
  eventId: "9e0e17e6-8b6e-4846-a71d-eabc09a38c2e"
}))


async function seed() {

  await prisma.event.create({
    data: {
      id: "9e0e17e6-8b6e-4846-a71d-eabc09a38c2e",
      title: 'Unite Summit',
      slug: 'unit-summit',
      details: "Um evento p/ devs apaixonados(as) por código!",
      maximumAttendees: 120
    }
  })


  await prisma.attendee.createMany({
    data: attendees
  })
}


seed().then(async () => {
  await prisma.$disconnect()
})