import {
  // extractSchemaLocation, getXmlText,
  useWorker, validateXml
} from 'xml-xsd-validator-browser';

// if use xml file url
// const fileurl = "/test/xml_file.xml";
// const xmlText = await getXmlText(fileurl);

const xmlText =
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE dmodule >
<dmodule xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dc="http://www.purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:noNamespaceSchemaLocation="https://ferdisap.github.io/schema/s1000d/S1000D_5-0/xml_schema_flat/appliccrossreftable.xsd"><identAndStatusSection></identAndStatusSection></dmodule>`;
try {
  await validateXml(xmlText);
} catch (err) {
  // returning array contains object has name:"XMLValidateError"
  // eslint-disable-next-line no-console -- Testing
  console.log(err);
}

const xmlText2 =
  `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE dmodule >
<dmodule>
  <identAndStatusSection></identAndStatusSection>
</dmodule>`;
const mainSchemaUrl = 'https://ferdisap.github.io/schema/s1000d/S1000D_5-0/xml_schema_flat/appliccrossreftable.xsd';

const {validate, terminate} = useWorker();
try {
  const response = await validate(xmlText2, mainSchemaUrl);
  // never get resolved if the file is valid
  const {id, status, bags} = response;
  // returning array contains object has name:"XMLValidateError"
  // eslint-disable-next-line no-console -- Testing
  console.log(id, status, bags);
} catch (response) {
  // eslint-disable-next-line no-console -- Testing
  console.log(response);
  terminate();
}

// expected of test1 and tes2
/* eslint-disable @stylistic/max-len -- Long */
/*
[
  {
    name: "XMLValidateError",
    type: "xsd",
    detail: {
      message: "Element 'identAndStatusSection': Missing child element(s). Expected is ( dmAddress ).\\n",
      file: "",
      line: 3,
      col: 1
    }
  },
  {
    name: "XMLValidateError",
    type: "xsd",
    detail: {
      message: "Element 'dmodule': Missing child element(s). Expected is ( content ).\\n",
      file: "",
      line: 2,
      col: 1
    }
  }
]
*/
/* eslint-enable @stylistic/max-len -- Long */
