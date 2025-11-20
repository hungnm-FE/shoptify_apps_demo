// app/routes/app.settings.tsx
import {useState} from "react";
import '@shopify/polaris/build/esm/styles.css';
import {BlockStack, Button, Card, Layout, Page, TextField} from '@shopify/polaris';

export default function AppSettings() {
  const [shopLabel, setShopLabel] = useState("");
  const [email, setEmail] = useState("");

  const handleSave = () => {
    // TODO: gọi API BE để lưu
    console.log("Save settings:", {shopLabel, email});
  };

  return (
    <div>
      ssss
    </div>
  );
}
