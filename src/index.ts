import fastify from "fastify";
import { router } from "routes/router";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod'
import fastifyPrismaPlugin from './lib/prisma'
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUI from '@fastify/swagger-ui'

async function main() {
  const app = fastify()

  try {

    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.register(fastifySwagger, {
      swagger: {
        consumes: ["application/json"],
        produces: ["application/json"],
        info: {
          title: "pass.in",
          description: "Especifição da API para o back-end da aplicação pass.in construida durante o NLW Unite da Rocketseat.",
          version: "1.0.0"
        },
      },
      transform: jsonSchemaTransform,
    })
    app.register(fastifySwaggerUI, {
      routePrefix: "/docs"
    })

    app.setErrorHandler((error, _, reply) => {
      return reply.code(+error.code).send({
        message: error.message,
        code: error.code,
        cause: error?.cause
      })
    })

    app.register(fastifyPrismaPlugin)

    await app.register(router)



    await app.listen({
      port: 3333,
    }).then(res => console.log(`Server running at ${res}`))
  } catch (err) {
    app.log.error(err)
  }
}

main()