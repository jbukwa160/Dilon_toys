import { Breadcrumbs } from "./Breadcrumbs";

export function InfoPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="container-shop max-w-4xl pb-10">
      <Breadcrumbs items={[{ label: title }]} />
      <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
      {intro ? <p className="mt-3 text-lg text-ink-soft">{intro}</p> : null}
      <div className="mt-8 space-y-6 [&_h2]:text-2xl [&_h2]:font-black [&_li]:ml-5 [&_li]:list-disc [&_li]:py-0.5 [&_p]:leading-relaxed [&_p]:text-ink-soft [&_section]:rounded-3xl [&_section]:border [&_section]:border-line [&_section]:bg-white [&_section]:p-6 md:[&_section]:p-8 [&_section>*+*]:mt-3 [&_ul]:text-ink-soft">
        {children}
      </div>
    </div>
  );
}
