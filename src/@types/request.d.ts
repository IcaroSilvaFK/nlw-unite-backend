import 'fastify'
import { PrismaClient } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient<{ log: "query"[] }, never, DefaultArgs>
  }
  interface FastifyRequest {
    db: PrismaClient<{ log: "query"[] }, never, DefaultArgs>
  }
} 