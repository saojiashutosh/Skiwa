"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/studio/fields";
import { Button } from "@/components/ui/button";
import { useInvalidateAdmin, type AdminImage } from "@/hooks/admin";
import { api, apiErrorMessage } from "@/lib/api";

interface ImageManagerProps {
  productId: number;
  images: AdminImage[];
}

export function ImageManager({ productId, images }: ImageManagerProps) {
  const invalidate = useInvalidateAdmin();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!url.trim()) {
      toast.error("Paste an image URL (Cloudinary, Unsplash…).");
      return;
    }
    setAdding(true);
    try {
      await api.post("/manage/product-images/", {
        product: productId,
        image_url: url.trim(),
        alt_text: alt.trim(),
        sort_order: images.length,
      });
      setUrl("");
      setAlt("");
      invalidate();
      toast.success("Image added.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not add the image."));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (imageId: number) => {
    try {
      await api.delete(`/manage/product-images/${imageId}/`);
      invalidate();
      toast.success("Image removed.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <section className="mt-12">
      <h2 className="heading border-b border-border pb-3 text-2xl text-foreground">
        Images
        <span className="ml-3 text-sm text-muted-foreground">
          first = main, second = hover
        </span>
      </h2>

      <div className="mt-6 flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div key={image.id} className="group relative">
            <div className="relative h-40 w-32 overflow-hidden border border-border bg-muted">
              <Image src={image.url} alt={image.alt_text} fill sizes="128px" className="object-cover" />
            </div>
            <span className="absolute left-1 top-1 bg-background/90 px-1.5 py-0.5 font-button text-[10px] uppercase tracking-widest text-foreground">
              {index === 0 ? "Main" : index === 1 ? "Hover" : `#${index + 1}`}
            </span>
            <button
              type="button"
              onClick={() => remove(image.id)}
              aria-label="Remove image"
              className="absolute right-1 top-1 bg-background/90 p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <p className="text-sm text-muted-foreground">No images yet — the card shows a placeholder.</p>
        )}
      </div>

      <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Image URL" value={url} onChange={setUrl} placeholder="https://…" />
        <Field label="Alt Text (optional)" value={alt} onChange={setAlt} />
        <div className="self-end">
          <Button variant="outline" onClick={add} loading={adding}>
            Add Image
          </Button>
        </div>
      </div>
    </section>
  );
}
