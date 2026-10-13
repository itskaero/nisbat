import { Suspense } from "react";
import { PhoneRemote } from "@/features/remote/phone-remote";

export default function Page() {
  return (
    <Suspense>
      <PhoneRemote />
    </Suspense>
  );
}
