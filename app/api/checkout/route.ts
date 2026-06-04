import Stripe from 'stripe'
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!)
export async function POST(req: Request) {
  try {
    const { eventId, eventTitle, price } = await req.json()
    if (!eventId || !eventTitle || !price) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const session = await stripe.checkout.sessions.create({
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