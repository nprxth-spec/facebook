export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex-1 w-full h-full bg-slate-50 dark:bg-zinc-950">
            {children}
        </div>
    );
}
