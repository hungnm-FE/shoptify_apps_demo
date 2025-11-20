// app/routes/api.partners.tsx
import prisma from "../db.server";

export async function loader() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify(partners), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // DEV: cho phép mọi origin. Nếu muốn chặt hơn có thể ghi rõ domain shop:
      // "Access-Control-Allow-Origin": "https://test-shop-23457618329548745799.myshopify.com",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
