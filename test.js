import xsdValidator from 'xsd-validator';

const xmlDocument = `<?xml version="1.0"?>
<recipe xmlns="http://www.namespace.org/recipe">
  <description>
    <title>sugar cookies</title>
  </description>
</recipe>`;
const xsdSchema = `<?xml version="1.0" encoding="utf-8"?>
<xsd:schema
   elementFormDefault="qualified"
   xmlns="http://www.namespace.org/recipe"
   targetNamespace="http://www.namespace.org/recipe"

   version="1.0"
   xmlns:xsd="http://www.w3.org/2001/XMLSchema"
   xmlns:r="http://www.namespace.org/recipe">

  <xsd:element name="recipe">
    <xsd:complexType>
      <xsd:choice>
        <xsd:element name="description" type="descriptionType"
          minOccurs="1" maxOccurs="1" />
      </xsd:choice>
    </xsd:complexType>
  </xsd:element>

  <xsd:complexType name="descriptionType">
    <xsd:all>
      <xsd:element name="title">
        <xsd:simpleType>
          <xsd:restriction base="xsd:string">
            <xsd:minLength value="5" />
            <xsd:maxLength value="55" />
          </xsd:restriction>
        </xsd:simpleType>
      </xsd:element>
    </xsd:all>
  </xsd:complexType>
</xsd:schema>`;

const isValid = xsdValidator.default(xmlDocument, xsdSchema);

// eslint-disable-next-line no-console -- Testing
console.log('isValid', isValid);
