// app/routes/app.ratings.tsx
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

// dùng chung style với app.tsx: import từ "react-router"
import {
  useActionData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

type ActionData = {
  ok?: boolean;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  // không dùng json helper nữa, dùng Response.json
  return Response.json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const productId = formData.get("productId")?.toString();
  const rating = Number(formData.get("rating"));
  const mode = formData.get("_mode")?.toString(); // "save" | "delete"

  if (!productId) {
    return Response.json(
      { error: "Missing productId" } as ActionData,
      { status: 400 },
    );
  }

  if (mode === "save" && (rating < 1 || rating > 5)) {
    return Response.json(
      { error: "Rating phải từ 1 đến 5" } as ActionData,
      { status: 400 },
    );
  }

  const { admin } = await authenticate.admin(request);

  if (mode === "delete") {
    // xoá metafield
    const mutation = `#graphql
      mutation DeleteRating($ownerId: ID!, $namespace: String!, $key: String!) {
        metafieldDelete(namespace: $namespace, key: $key, ownerId: $ownerId) {
          deletedId
          userErrors { field message }
        }
      }
    `;
    await admin.graphql(mutation, {
      variables: {
        ownerId: productId,
        namespace: "rating_app",
        key: "rating_value",
      },
    });

    return Response.json({ ok: true } as ActionData);
  }

  // save / update metafield
  const mutation = `#graphql
    mutation SetRating($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key namespace value }
        userErrors { field message }
      }
    }
  `;

  await admin.graphql(mutation, {
    variables: {
      metafields: [
        {
          ownerId: productId,
          namespace: "rating_app",
          key: "rating_value",
          type: "number_integer",
          value: String(rating),
        },
      ],
    },
  });

  return Response.json({ ok: true } as ActionData);
}

export default function RatingsPage() {
  const actionData = useActionData() as ActionData | undefined;

  return (
    <s-page>
      <TitleBar title="Product ratings" />

      <s-section heading="Thêm / sửa rating sản phẩm">
        {actionData?.error && (
          <s-banner tone="critical">{actionData.error}</s-banner>
        )}
        {actionData?.ok && (
          <s-banner tone="success">Đã lưu rating</s-banner>
        )}

        <s-inline-stack gap="400" direction="vertical">
          <form method="post">
            <s-text-field
              label="Product ID"
              name="productId"
              placeholder="gid://shopify/Product/1234567890"
            />
            <s-text-field
              label="Rating (1-5)"
              name="rating"
              type="number"
              min="1"
              max="5"
            />

            <s-inline-stack gap="200">
              <button type="submit" name="_mode" value="save">
                <s-button variant="primary">Save rating</s-button>
              </button>

              <button type="submit" name="_mode" value="delete">
                <s-button tone="critical">Delete rating</s-button>
              </button>
            </s-inline-stack>
          </form>
        </s-inline-stack>
      </s-section>
    </s-page>
  );
}
