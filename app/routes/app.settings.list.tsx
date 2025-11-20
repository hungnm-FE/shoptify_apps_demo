// app/routes/app.settings.list.tsx
import { TitleBar } from "@shopify/app-bridge-react";

export default function SettingsList() {
  return (
    <s-page>
      <TitleBar title="Settings list" />

      <s-section heading="List of items">
        <s-paragraph>
          Đây là trang Settings/List. Bạn có thể render dữ liệu ở đây.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
