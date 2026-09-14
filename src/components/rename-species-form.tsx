import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function RenameSpeciesForm({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState(name);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
      }}
    >
      <Field label="Tên loài" htmlFor="rename-sp">
        <Input
          id="rename-sp"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Button type="submit">Lưu tên</Button>
    </form>
  );
}
