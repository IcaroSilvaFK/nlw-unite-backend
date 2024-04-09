import { PrismaClient, } from "@prisma/client";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import fp from 'fastify-plugin';

async function prismaPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {

  const prisma = new PrismaClient({
    log: ['query']
  })

  fastify.decorate("db", prisma)


  fastify.addHook("onRequest", (req, _, done) => {
    req.db = prisma
    done()
  })


  fastify.addHook("onClose", async (fastifyInstance) => {
    await fastifyInstance.db.$disconnect()
  })
}


export default fp(prismaPlugin)




