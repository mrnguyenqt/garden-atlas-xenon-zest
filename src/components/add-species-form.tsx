import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { ImagePicker } from "@/components/image-picker";
import type { CustomSpeciesDraft } from "@/lib/custom-species";

export function AddSpeciesForm({
  initialName = "",
  onSubmit,
}: {
  initialName?: string;
  onSubmit: (draft: CustomSpeciesDraft) => void;
}) {
  const [name, setName] = useState(initialName);
  const [latin, setLatin] = useState("");
  const [family, setFamily] = useState("");
  const [notes, setNotes] = useState("");
  const [treeImage, setTreeImage] = useState("");
  const [leafImage, setLeafImage] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name, latin, family, notes, treeImage, leafImage });
      }}
    >
      <Field label="Tên Việt" htmlFor="sp-name">
        <Input
          id="sp-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Keo tai tượng"
          autoComplete="off"
        />
      </Field>
      <Field label="Tên Latin" htmlFor="sp-latin">
        <Input
          id="sp-latin"
          value={latin}
          onChange={(e) => setLatin(e.target.value)}
          placeholder="Acacia mangium"
          autoComplete="off"
        />
      </Field>
      <Field label="Họ" htmlFor="sp-family">
        <Input
          id="sp-family"
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          placeholder="Fabaceae"
          autoComplete="off"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker id="sp-tree" label="Ảnh cây" value={treeImage} onChange={setTreeImage} />
        <ImagePicker id="sp-leaf" label="Ảnh lá" value={leafImage} onChange={setLeafImage} />
      </div>
      <Field label="Ghi chú" htmlFor="sp-notes">
        <Textarea
          id="sp-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Lập địa, nguồn giống…"
        />
      </Field>
      <Button type="submit">Lưu loài</Button>
    </form>
  );
}
