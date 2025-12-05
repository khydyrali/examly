"use client";

import { Editor } from "@tinymce/tinymce-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  onUploadImage?: (file: File) => Promise<string | null>;
};

// Full-featured TinyMCE editor with optional Supabase image upload hook.
export function RichTextEditor({ value, onChange, placeholder, minHeight, onUploadImage }: Props) {
  // Priority: env var, then provided shared key, then "no-api-key" for local testing.
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "ppqqa138bso5jwhay3o7px1jspjhmfa43xjmglnswf79g3d4" || "no-api-key";
  const tinymceScriptSrc = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6/tinymce.min.js`;

  return (
    <div className="rounded-md border border-gray-300 bg-white text-sm shadow-sm dark:border-gray-700 dark:bg-neutral-900">
      <Editor
        value={value}
        onEditorChange={(content) => onChange(content)}
        tinymceScriptSrc={tinymceScriptSrc}
        init={{
          height: Math.max(minHeight ?? 220, 220),
          menubar: "file edit view insert format tools table help",
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "help",
            "wordcount",
            "pagebreak",
          ],
          toolbar:
            "undo redo | styles blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code fullscreen",
          placeholder: placeholder ?? "Type or paste your content here!",
          branding: false,
          promotion: false,
          content_style:
            "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; padding: 12px; }",
          images_upload_handler: onUploadImage
            ? async (blobInfo) => {
                const file = blobInfo.blob();
                const url = await onUploadImage(file);
                if (!url) throw new Error("Image upload failed");
                return url;
              }
            : undefined,
        }}
      />
    </div>
  );
}
