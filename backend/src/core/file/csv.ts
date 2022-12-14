export function parseCSVFile(
  file: Buffer,
  separator = ';'
): Record<string, string | null>[] {
  return parseCSVFileContent(file.toString('utf-8'), separator);
}

function parseCSVFileContent(
  fileContentAsText: string,
  separator = ';'
): Record<string, string | null>[] {
  // Extract CSV rows
  const rows = fileContentAsText.split('\n');

  // Extract first Row of CSV file and parse it to Header
  let headers: string[] = [];
  if (rows.length > 0) {
    headers = rows[0].split(separator).map((v) => v.replace('\r', ''));
    rows.shift(); // Remove header (first row) from formattedRows, which are transformed to the data
  }

  // Extract Rows
  const csvArray = rows.map((row) => {
    const rowObject: Record<string, string | null> = {};
    const values = row.split(separator);

    // Map row values into an object with the extracted header keys
    values.map((value, i) => {
      rowObject[headers[i]] = value.replace('\r', '');
      // Replace empty column with 'null'
      if (rowObject[headers[i]] === '') {
        rowObject[headers[i]] = null;
      }
    });

    return rowObject;
  });

  return csvArray;
}
