import { revalidatePath } from "next/cache";

export function revalidateNurse() {
  revalidatePath("/app", "layout");
  revalidatePath("/p", "layout");
}
