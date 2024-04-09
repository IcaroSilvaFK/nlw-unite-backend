import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generateSlug } from 'utils/generateSlug'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { NotFoundError } from 'errors/notFoundError'
import { BadRequestException } from 'errors/badRequestException'

export async function router(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post("/events", {
    schema: {
      summary: "Create a new event",
      tags: ["events"],
      body: z.object({
        title: z.string().min(4),
        details: z.string().nullable(),
        maximumAttendees: z.number().int().positive().nullable()
      }),
      response: {
        201: z.object({
          eventId: z.string().uuid(),
        })
      }
    }
  }, async (req, reply) => {


    const body = req.body

    const slug = generateSlug(body.title)

    const eventWithSameSlug = await req.db.event.findUnique({
      where: {
        slug,
      }
    })

    if (eventWithSameSlug) {
      throw new BadRequestException(`THIS ${eventWithSameSlug.title} ALREADY EXISTS.`)
    }

    const response = await req.db.event.create({
      data: {
        title: body.title,
        slug,
        details: body?.details,
        maximumAttendees: body?.maximumAttendees
      }
    })

    return reply.code(201).send({
      eventId: response.id,
    })
  })

  app.withTypeProvider<ZodTypeProvider>().post("/events/:eventId/attendees", {
    schema: {
      summary: "Add attendee an event",
      tags: ["events", "attendees"],
      params: z.object({
        eventId: z.string().uuid()
      }),
      body: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      response: {
        201: z.object({
          attendeeId: z.number()
        })
      }
    }
  }, async (req, reply) => {

    const eventId = req.params.eventId
    const user = req.body

    const attendeeIsRegisterInEvent = await req.db.attendee.findUnique({
      where: {
        eventId_email: {
          email: user.email,
          eventId,
        }
      }
    })

    if (attendeeIsRegisterInEvent) {
      throw new BadRequestException("ATTENDEE ALREADY REGISTER IN EVENT")
    }

    const amountOfAttendeesFromEvent = await req.db.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        maximumAttendees: true,
        _count: {
          select: {
            attendees: true
          }
        }
      }
    })

    const eventIsNotAvailableFromSubscription = amountOfAttendeesFromEvent?.maximumAttendees && amountOfAttendeesFromEvent.maximumAttendees <= amountOfAttendeesFromEvent?._count.attendees

    if (eventIsNotAvailableFromSubscription) {
      throw new BadRequestException("EVENT IS NOT AVAILABLE FROM SUBSCRIPTIONS")
    }

    const registeredAttendeeInEvent = await req.db.attendee.create({
      data: {
        eventId: eventId,
        email: user.email,
        name: user.name,
      }
    })

    return reply.code(201).send({
      attendeeId: registeredAttendeeInEvent.id,
    })
  })

  app.withTypeProvider<ZodTypeProvider>().get("/events/:eventId", {
    schema: {
      summary: "Find event by id",
      tags: ["events"],
      params: z.object({
        eventId: z.string().uuid()
      }),
      response: {
        200: z.object({
          event: z.object({
            id: z.string().uuid(),
            title: z.string(),
            details: z.string().nullable(),
            slug: z.string(),
            attendeesAmount: z.number(),
            maximumAttendees: z.number().nullable()
          })
        })
      }
    }
  }, async (req, reply) => {

    const { eventId } = req.params


    const event = await req.db.event.findUnique({
      where: {
        id: eventId
      },
      select: {
        id: true,
        title: true,
        details: true,
        slug: true,
        maximumAttendees: true,
        _count: {
          select: {
            attendees: true
          }
        }
      }
    })
    if (!event) {
      throw new NotFoundError(`Event with id ${eventId} not exists.`)
    }

    return reply.send({
      event: {
        id: event.id,
        title: event.title,
        details: event?.details,
        slug: event.slug,
        attendeesAmount: event._count.attendees,
        maximumAttendees: event?.maximumAttendees
      }
    })
  })

  app.withTypeProvider<ZodTypeProvider>().get("/attendees/:attendeeId/badge", {
    schema: {
      summary: "Generate check in url",
      tags: ["events", "attendees"],
      params: z.object({
        attendeeId: z.coerce.number().int().positive()
      }),
      response: {
        200: z.object({
          badge: z.object({
            attendee: z.object({
              email: z.string().email(),
              name: z.string(),
              event: z.object({
                title: z.string(),
                slug: z.string()
              })
            }),
            checkInUrl: z.string().url()
          })
        })
      }
    }
  }, async (req, reply) => {
    const { attendeeId } = req.params

    const attendee = await req.db.attendee.findUnique({
      where: {
        id: attendeeId
      },
      select: {
        name: true,
        email: true,
        event: {
          select: {
            title: true,
            slug: true
          }
        }
      }
    })

    if (!attendee) {
      throw new NotFoundError("Attendee not registered.")
    }
    const baseUrl = `${req.protocol}://${req.hostname}/`

    const checkInUrl = new URL(`/attendees/${attendeeId}/check-in`, baseUrl)



    return reply.send({
      badge: {
        attendee: { ...attendee },
        checkInUrl: checkInUrl.toString()
      }
    })

  })


  app.withTypeProvider<ZodTypeProvider>().get("/attendees/:attendeeId/check-in", {
    schema: {
      summary: "Execute check in from event",
      tags: ["events", "attendees"],
      params: z.object({
        attendeeId: z.coerce.number().int().positive()
      }),
      response: {
        201: z.null()
      }
    }
  }, async (req, reply) => {

    const { attendeeId } = req.params


    const attendeeCheckIn = await req.db.checkIn.findUnique({
      where: {
        attendeeId
      }
    })

    if (attendeeCheckIn) {
      throw new BadRequestException("ATTENDEE ALREADY REALIZED CHECK-IN")
    }

    await req.db.checkIn.create({
      data: {
        attendeeId,
      }
    })


    return reply.status(201).send()
  })

  app.withTypeProvider<ZodTypeProvider>().get("/events/:eventId/attendees", {
    schema: {
      summary: "Get attendees from event",
      tags: ["events", "attendees"],
      params: z.object({
        eventId: z.string().uuid()
      }),
      querystring: z.object({
        pageIndex: z.string().nullish().default("0").transform(Number),
        query: z.string().nullish()
      }),
      response: {
        200: z.object({
          attendees: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              email: z.string().email(),
              createdAt: z.date(),
              checkInAt: z.date().nullable()
            })
          ),
          quantityPages: z.number(),
          count: z.number(),
          showing: z.number()
        })
      }
    }
  }, async (req, reply) => {

    const { eventId } = req.params
    const { pageIndex, query } = req.query

    const [count, attendees] = await req.db.$transaction(
      [
        req.db.attendee.count({
          where: {
            eventId,
            ...(query && {
              name: {
                contains: query,
              },
            })
          }
        }),
        req.db.attendee.findMany({
          where: {
            eventId,
            ...(query && {
              name: {
                contains: query,
              },
            })
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            checkIn: {
              select: {
                createdAt: true
              },
            },

          },
          take: 10,
          skip: pageIndex * 10,
          orderBy: {
            createdAt: 'desc'
          },
        })])

    const quantityPages = Math.ceil(count / 10)
    const showing = (pageIndex + 1) * 10

    return reply.send({
      attendees: attendees.map((item) => ({
        id: item.id,
        email: item.email,
        name: item.name,
        createdAt: item.createdAt,
        checkInAt: item.checkIn?.createdAt ?? null
      })),
      quantityPages,
      count,
      showing
    })
  })

}