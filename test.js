import {validateXml} from 'xml-xsd-validator-browser';

const xmlDocument = `<?xml version="1.0"?>
<recipe xmlns="http://www.namespace.org/recipe">
  <description>
    <title>sugar cookies</title>
  </description>
</recipe>`;
const xsdSchema = 'http://localhost:8021/schema.xsd';

try {
  const isValid = await validateXml(xmlDocument, xsdSchema);

  // eslint-disable-next-line no-console -- Testing
  console.log('isValid', isValid);
} catch (err) {
  // eslint-disable-next-line no-console -- Debugging
  console.log('err', err);
}
