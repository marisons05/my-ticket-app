import Stripe from 'stripe'

// Lazy init — avoids Stripe throwing at module evaluation during Next.js build
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!)
  return _stripe
}

export async function POST(req: Request) {
  try {
    const { eventId, eventTitle, price } = await req.json()
    if (!eventId || !eventTitle || !price) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: eventTitle,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env['NEXT_PUBLIC_URL']}/success?eventId=${eventId}`,
      cancel_url: `${process.env['NEXT_PUBLIC_URL']}/checkout?eventId=${eventId}`,
    })
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}