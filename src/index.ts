import fastify from "fastify";
import { router } from "routes/router";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod'
import fastifyPrismaPlugin from './lib/prisma'
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUI from '@fastify/swagger-ui'
import { ZodError } from "zod";
import fastifyCors from "@fastify/cors";

async function main() {
  const app = fastify()

  try {

    await app.register(fastifyCors, {
      origin: "*"
    })

    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    await app.register(fastifySwagger, {
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
    await app.register(fastifySwaggerUI, {
      routePrefix: "/docs"
    })

    app.setErrorHandler((error, _, reply) => {
      const { validationContext } = error

      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: `Error on validating request ${validationContext}`,
          code: 400,
          causes: error.flatten().fieldErrors,
        })
      }

      return reply.code(+error.code).send({
        message: error.message,
        code: error.code,
        causes: error?.cause
      })
    })

    await app.register(fastifyPrismaPlugin)

    await app.register(router)



    await app.listen({
      port: 3333,
      host: '0.0.0.0'
    }).then(res => console.log(`Server running at ${res}`))
  } catch (err) {
    app.log.error(err)
  }
}

main()