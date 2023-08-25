export default function createTable(cols, rows, numbered = true, title = "") {
  let colspan = 0;
  for (let col of cols) {
    colspan += col.colspan ?? 1;
  }
  let html = `
        <table>
            ${
              title !== ""
                ? `<tr>
                <th colspan=${colspan}>${title}</th>
            </tr>`
                : ""
            }
            <tr>
                ${cols
                  .map((x) => {
                    return `<th colspan=${x.colspan ?? 1}>${x.header}</th>`;
                  })
                  .join(" ")}
            </tr>
            ${rows
              .map((x, i) => {
                let text = "<tr>";
                if (numbered) text += `<td>${i + 1}</td>`;
                for (let col of cols) {
                  if (col.custom !== undefined) {
                    text += `<td>${col.custom(x)}</td>`;
                  } else {
                    text += `<td>${x[col.sql]}</td>`;
                  }
                }
                text += "</tr>";
                return text;
              })
              .join(" ")}
        </table>`;
  return html;
}
