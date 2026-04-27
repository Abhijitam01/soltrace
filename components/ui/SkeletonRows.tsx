export function SkeletonRows() {
  return (
    <tbody aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <tr key={i} className="border-b border-sand/60">
          <td className="py-3 px-3">
            <div className="h-3.5 w-24 bg-light-sand rounded animate-pulse" />
          </td>
          <td className="py-3 px-3">
            <div className="h-3.5 w-12 bg-light-sand rounded animate-pulse" />
          </td>
          <td className="py-3 px-3">
            <div className="h-3.5 w-16 ml-auto bg-light-sand rounded animate-pulse" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}
