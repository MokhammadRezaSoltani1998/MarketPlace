"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductImage({ id, title, className = "", version }: { id: string; title: string; className?: string; version?: number }) {
  const [failed, setFailed] = useState(false);
  const src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${id}/cover${version ? `?v=${version}` : ""}`;

  if (failed) {
    return <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>Фото товара</div>;
  }

  return <Image src={src} alt={title} width={600} height={450} unoptimized className={`object-cover ${className}`} onError={() => setFailed(true)} />;
}
