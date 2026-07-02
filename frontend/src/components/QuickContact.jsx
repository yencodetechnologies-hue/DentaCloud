export default function QuickContact({ phone }) {
  if (!phone) return <>—</>;
  const digits = phone.replace(/[^\d+]/g, "");
  const btnStyle = { marginLeft: 6, textDecoration: "none" };
  return (
    <span onClick={(e) => e.stopPropagation()}>
      {phone}
      <a href={`tel:${digits}`} title="Call" style={btnStyle}>📞</a>
      <a href={`https://wa.me/${digits.replace("+", "")}`} title="WhatsApp" target="_blank" rel="noreferrer" style={btnStyle}>💬</a>
    </span>
  );
}
