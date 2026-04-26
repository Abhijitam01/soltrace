export function SkeletonRows() {
  return (
    <tbody aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <tr key={i} className="border-b border-slate-700/50">
          <td className="py-3 pr-4">
            <div className="h-4 w-[30%] bg-slate-700/50 rounded animate-pulse" />
          </td>
          <td className="py-3 pr-4">
            <div className="h-4 w-[20%] bg-slate-700/50 rounded animate-pulse" />
          </td>
          <td className="py-3">
            <div className="h-4 w-[15%] ml-auto bg-slate-700/50 rounded animate-pulse" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}
