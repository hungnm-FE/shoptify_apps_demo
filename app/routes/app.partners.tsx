// app/routes/app.partners.tsx
import React from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

import {
  useLoaderData,
  useActionData,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import prisma from "../db.server";

type Partner = {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
};

type LoaderData = {
  partners: Partner[];
};

type ActionData = {
  ok?: boolean;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { partners } as LoaderData;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_action")?.toString(); // create | update | delete

  try {
    if (intent === "create") {
      const name = formData.get("name")?.toString() ?? "";
      const imageUrl = formData.get("imageUrl")?.toString() ?? "";
      const description = formData.get("description")?.toString() ?? "";

      if (!name) return { error: "Tên không được để trống" } as ActionData;

      await prisma.partner.create({
        data: { name, imageUrl, description },
      });
      return { ok: true } as ActionData;
    }

    if (intent === "update") {
      const id = Number(formData.get("id"));
      const name = formData.get("name")?.toString() ?? "";
      const imageUrl = formData.get("imageUrl")?.toString() ?? "";
      const description = formData.get("description")?.toString() ?? "";

      if (!id) return { error: "Thiếu id" } as ActionData;

      await prisma.partner.update({
        where: { id },
        data: { name, imageUrl, description },
      });
      return { ok: true } as ActionData;
    }

    if (intent === "delete") {
      const id = Number(formData.get("id"));
      if (!id) return { error: "Thiếu id" } as ActionData;
      await prisma.partner.delete({ where: { id } });
      return { ok: true } as ActionData;
    }

    return { error: "Unknown action" } as ActionData;
  } catch (e: any) {
    console.error(e);
    return { error: "Có lỗi khi lưu đối tác" } as ActionData;
  }
}

export default function PartnersPage() {
  const { partners } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;

  const [editing, setEditing] = React.useState<Partner | null>(null);

  return (
    <s-page>
      <TitleBar title="Partners" />

      <s-section heading="Quản lý đối tác">
        {actionData?.error && (
          <s-banner tone="critical">{actionData.error}</s-banner>
        )}
        {actionData?.ok && (
          <s-banner tone="success">Đã lưu thành công</s-banner>
        )}

        {/* Form create / update */}
        <s-card>
          <form method="post">
            {editing && (
              <input type="hidden" name="id" value={editing.id} />
            )}

            <s-text-field
              label="Tên đối tác"
              name="name"
              value={editing?.name ?? ""}
              onInput={(e: any) =>
                setEditing((old) => ({
                  ...(old ?? { id: 0, imageUrl: "", description: "" }),
                  name: e.target.value,
                }))
              }
            />
            <s-text-field
              label="Ảnh (URL)"
              name="imageUrl"
              value={editing?.imageUrl ?? ""}
              onInput={(e: any) =>
                setEditing((old) => ({
                  ...(old ?? { id: 0, name: "", description: "" }),
                  imageUrl: e.target.value,
                }))
              }
            />
            <s-text-field
              label="Mô tả"
              name="description"
              value={editing?.description ?? ""}
              onInput={(e: any) =>
                setEditing((old) => ({
                  ...(old ?? { id: 0, name: "", imageUrl: "" }),
                  description: e.target.value,
                }))
              }
            />

            <s-inline-stack gap="200">
              <button
                type="submit"
                name="_action"
                // value={editing ? "update" : "create"}
                value="create"
              >
                <s-button variant="primary">
                  {/*{editing ? "Cập nhật" : "Thêm mới"}*/}
                  Thêm mới
                </s-button>
              </button>

              {editing && (
                <s-button
                  tone="critical"
                  onClick={(e: any) => {
                    e.preventDefault();
                    setEditing(null);
                  }}
                >
                  Huỷ chỉnh sửa
                </s-button>
              )}
            </s-inline-stack>
          </form>
        </s-card>

        {/* Danh sách đối tác */}
        <s-divider />

        <s-inline-stack direction="vertical" gap="200">
          {partners.map((p) => (
            <s-card key={p.id}>
              <s-inline-stack gap="200" blockAlign="center">
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: 60, height: 60, objectFit: "cover" }}
                  />
                )}
                <s-inline-stack direction="vertical" gap="100">
                  <b>{p.name}</b>
                  <span>{p.description}</span>
                </s-inline-stack>

                <s-inline-stack gap="100">
                  <s-button
                    onClick={(e: any) => {
                      e.preventDefault();
                      setEditing(p);
                    }}
                  >
                    Sửa
                  </s-button>

                  <form method="post">
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" name="_action" value="delete">
                      <s-button tone="critical">Xoá</s-button>
                    </button>
                  </form>
                </s-inline-stack>
              </s-inline-stack>
            </s-card>
          ))}

          {partners.length === 0 && <span>Chưa có đối tác nào.</span>}
        </s-inline-stack>
      </s-section>
    </s-page>
  );
}
