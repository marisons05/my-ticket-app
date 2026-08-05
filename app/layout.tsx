import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheMix",
  description: "Discover live music events in Riga",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceMono.variable} h-full antialiased`}
    >
<head>
        <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACkklEQVR4nO1bbW7UMBD13oQK/kMBiXjS1QpuwIfgLrGXULgJyzUWxKqi4gLdwg268SQ0ixQVaWU0aVXoErIbGmIn8UjvT+QfM2/G44nlx9hG04PxXnRPAL6WHD8IjseS43cJqK3CuU9z8lFy3A+8xd3NsZWaHkgfn0uOX4wH9484T5Z6RrGwKibg200J+Nl0ADVWx6EYJjvbBe/HewLwxLjTtUMpwaNHpcGPIXooQf0w7+z/gQB1NvbiUXHmh8mO5Gph2skmKiH0Tm6tha8HndrzmyqBq09XGqMAfGHaqaYRgHr6K/stPuqugXkefgDRfQucMQOe7DIJ+Ma4I4YgOL5i+ehogTOGMKUG+LXHFXDMBMdljwlYMhscMQlm2oFOExCOUM/eZTpVK02WRis9m2T5914QMJtkusjoey8ISC8yv25LteoHAWVmOnBHALgK0NZtAROnBrOJABOnBrOJABOnBrOJgKrrHQHgKkA3ugXCil26c1tgVrFLd46AtGKX7hwBZeYIgOYJq2NyZG2ugDomR9ZmAuqYHFmbCai63hEArgK02wLgeoB2TRDcKaDdMQhuDtBuEAI3CWo3Ckv3L4DuZ0huSQJdOBTZ6WLVivXFP0Mc020X/+0C4uPbrBXr1yEAT1mVZ7L5FdQku2R+0xWUbesLMKdncu+rNMKOYUoVsG+BI0YgQL1kpK4y7Ygx+PHt/Ll8rq7qXfbx6FIwQdIy0w41jcBTj69KZjge9if76uAPLWH4ILnRF9EU6SKLZXNePCJpWYczfzaGeFiuHfTQ76pwknSRpcH/riEkaVmHMn9AW5xVMz0gaVmuyG5t4HgkffWEXdckT3ZJYESjIxFio8rkwidK1lSCCgNI7mwT3E8n2IVF3348xQAAAABJRU5ErkJggg==" />
      </head>
      <body className="min-h-full flex flex-col">{children}<Footer /></body>
    </html>
  );
}
