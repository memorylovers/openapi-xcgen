# OpenAPI 3.1 BNF Specification

- [OpenAPI Specification - Version 3.1.0 | Swagger](https://swagger.io/specification/)

```bnf
; OpenAPI 3.1 Document Structure in BNF notation
; Terminal symbols are enclosed in quotes
; Non-terminal symbols are in angle brackets

; Root Document
<openapi-document> ::= <openapi-object>

; OpenAPI Object
<openapi-object> ::= "{" <openapi-fields> "}"

<openapi-fields> ::= <openapi-field> | <openapi-field> "," <openapi-fields>

<openapi-field> ::= <openapi-version>
                  | <info-field>
                  | <json-schema-dialect-field>
                  | <servers-field>
                  | <paths-field>
                  | <webhooks-field>
                  | <components-field>
                  | <security-field>
                  | <tags-field>
                  | <external-docs-field>
                  | <extension-field>

<openapi-version> ::= '"openapi"' ":" <version-string>
<version-string> ::= '"3.1.' <digit> <digits> '"'

<info-field> ::= '"info"' ":" <info-object>
<json-schema-dialect-field> ::= '"jsonSchemaDialect"' ":" <string>
<servers-field> ::= '"servers"' ":" <servers-array>
<paths-field> ::= '"paths"' ":" <paths-object>
<webhooks-field> ::= '"webhooks"' ":" <webhooks-object>
<components-field> ::= '"components"' ":" <components-object>
<security-field> ::= '"security"' ":" <security-requirements-array>
<tags-field> ::= '"tags"' ":" <tags-array>
<external-docs-field> ::= '"externalDocs"' ":" <external-docs-object>

; Info Object
<info-object> ::= "{" <info-fields> "}"

<info-fields> ::= <info-field-item> | <info-field-item> "," <info-fields>

<info-field-item> ::= <title-field>
                    | <summary-field>
                    | <description-field>
                    | <terms-of-service-field>
                    | <contact-field>
                    | <license-field>
                    | <version-field>
                    | <extension-field>

<title-field> ::= '"title"' ":" <string>
<summary-field> ::= '"summary"' ":" <string>
<description-field> ::= '"description"' ":" <string>
<terms-of-service-field> ::= '"termsOfService"' ":" <string>
<contact-field> ::= '"contact"' ":" <contact-object>
<license-field> ::= '"license"' ":" <license-object>
<version-field> ::= '"version"' ":" <string>

; Contact Object
<contact-object> ::= "{" <contact-fields> "}" | "{" "}"

<contact-fields> ::= <contact-field-item> | <contact-field-item> "," <contact-fields>

<contact-field-item> ::= '"name"' ":" <string>
                       | '"url"' ":" <string>
                       | '"email"' ":" <string>
                       | <extension-field>

; License Object
<license-object> ::= "{" <license-fields> "}"

<license-fields> ::= <license-field-item> | <license-field-item> "," <license-fields>

<license-field-item> ::= '"name"' ":" <string>
                       | '"identifier"' ":" <string>
                       | '"url"' ":" <string>
                       | <extension-field>

; Server Object
<servers-array> ::= "[" <server-list> "]" | "[" "]"

<server-list> ::= <server-object> | <server-object> "," <server-list>

<server-object> ::= "{" <server-fields> "}"

<server-fields> ::= <server-field-item> | <server-field-item> "," <server-fields>

<server-field-item> ::= '"url"' ":" <string>
                      | '"description"' ":" <string>
                      | '"variables"' ":" <server-variables-object>
                      | <extension-field>

; Server Variables
<server-variables-object> ::= "{" <server-variable-entries> "}" | "{" "}"

<server-variable-entries> ::= <server-variable-entry> | <server-variable-entry> "," <server-variable-entries>

<server-variable-entry> ::= <string> ":" <server-variable-object>

<server-variable-object> ::= "{" <server-variable-fields> "}"

<server-variable-fields> ::= <server-variable-field> | <server-variable-field> "," <server-variable-fields>

<server-variable-field> ::= '"enum"' ":" <string-array>
                          | '"default"' ":" <string>
                          | '"description"' ":" <string>
                          | <extension-field>

; Paths Object
<paths-object> ::= "{" <path-item-entries> "}" | "{" "}"

<path-item-entries> ::= <path-item-entry> | <path-item-entry> "," <path-item-entries>

<path-item-entry> ::= <path-template> ":" <path-item-object>

<path-template> ::= <string>  ; Must start with "/"

; Path Item Object
<path-item-object> ::= <reference-object> | "{" <path-item-fields> "}" | "{" "}"

<path-item-fields> ::= <path-item-field> | <path-item-field> "," <path-item-fields>

<path-item-field> ::= '"$ref"' ":" <string>
                    | '"summary"' ":" <string>
                    | '"description"' ":" <string>
                    | '"get"' ":" <operation-object>
                    | '"put"' ":" <operation-object>
                    | '"post"' ":" <operation-object>
                    | '"delete"' ":" <operation-object>
                    | '"options"' ":" <operation-object>
                    | '"head"' ":" <operation-object>
                    | '"patch"' ":" <operation-object>
                    | '"trace"' ":" <operation-object>
                    | '"servers"' ":" <servers-array>
                    | '"parameters"' ":" <parameters-array>
                    | <extension-field>

; Operation Object
<operation-object> ::= "{" <operation-fields> "}"

<operation-fields> ::= <operation-field> | <operation-field> "," <operation-fields>

<operation-field> ::= '"tags"' ":" <string-array>
                    | '"summary"' ":" <string>
                    | '"description"' ":" <string>
                    | '"externalDocs"' ":" <external-docs-object>
                    | '"operationId"' ":" <string>
                    | '"parameters"' ":" <parameters-array>
                    | '"requestBody"' ":" <request-body-or-ref>
                    | '"responses"' ":" <responses-object>
                    | '"callbacks"' ":" <callbacks-object>
                    | '"deprecated"' ":" <boolean>
                    | '"security"' ":" <security-requirements-array>
                    | '"servers"' ":" <servers-array>
                    | <extension-field>

; External Documentation Object
<external-docs-object> ::= "{" <external-docs-fields> "}"

<external-docs-fields> ::= <external-docs-field> | <external-docs-field> "," <external-docs-fields>

<external-docs-field> ::= '"description"' ":" <string>
                        | '"url"' ":" <string>
                        | <extension-field>

; Parameter Object
<parameters-array> ::= "[" <parameter-list> "]" | "[" "]"

<parameter-list> ::= <parameter-or-ref> | <parameter-or-ref> "," <parameter-list>

<parameter-or-ref> ::= <parameter-object> | <reference-object>

<parameter-object> ::= "{" <parameter-fields> "}"

<parameter-fields> ::= <parameter-field> | <parameter-field> "," <parameter-fields>

<parameter-field> ::= '"name"' ":" <string>
                    | '"in"' ":" <parameter-location>
                    | '"description"' ":" <string>
                    | '"required"' ":" <boolean>
                    | '"deprecated"' ":" <boolean>
                    | '"allowEmptyValue"' ":" <boolean>
                    | '"style"' ":" <parameter-style>
                    | '"explode"' ":" <boolean>
                    | '"allowReserved"' ":" <boolean>
                    | '"schema"' ":" <schema-or-ref>
                    | '"example"' ":" <any-value>
                    | '"examples"' ":" <examples-object>
                    | '"content"' ":" <content-object>
                    | <extension-field>

<parameter-location> ::= '"query"' | '"header"' | '"path"' | '"cookie"'

<parameter-style> ::= '"matrix"' | '"label"' | '"form"' | '"simple"' 
                    | '"spaceDelimited"' | '"pipeDelimited"' | '"deepObject"'

; Request Body Object
<request-body-or-ref> ::= <request-body-object> | <reference-object>

<request-body-object> ::= "{" <request-body-fields> "}"

<request-body-fields> ::= <request-body-field> | <request-body-field> "," <request-body-fields>

<request-body-field> ::= '"description"' ":" <string>
                       | '"content"' ":" <content-object>
                       | '"required"' ":" <boolean>
                       | <extension-field>

; Media Type Object
<content-object> ::= "{" <media-type-entries> "}" | "{" "}"

<media-type-entries> ::= <media-type-entry> | <media-type-entry> "," <media-type-entries>

<media-type-entry> ::= <string> ":" <media-type-object>

<media-type-object> ::= "{" <media-type-fields> "}" | "{" "}"

<media-type-fields> ::= <media-type-field> | <media-type-field> "," <media-type-fields>

<media-type-field> ::= '"schema"' ":" <schema-or-ref>
                     | '"example"' ":" <any-value>
                     | '"examples"' ":" <examples-object>
                     | '"encoding"' ":" <encoding-object>
                     | <extension-field>

; Encoding Object
<encoding-object> ::= "{" <encoding-entries> "}" | "{" "}"

<encoding-entries> ::= <encoding-entry> | <encoding-entry> "," <encoding-entries>

<encoding-entry> ::= <string> ":" <encoding-property-object>

<encoding-property-object> ::= "{" <encoding-property-fields> "}" | "{" "}"

<encoding-property-fields> ::= <encoding-property-field> | <encoding-property-field> "," <encoding-property-fields>

<encoding-property-field> ::= '"contentType"' ":" <string>
                            | '"headers"' ":" <headers-object>
                            | '"style"' ":" <parameter-style>
                            | '"explode"' ":" <boolean>
                            | '"allowReserved"' ":" <boolean>
                            | <extension-field>

; Responses Object
<responses-object> ::= "{" <responses-fields> "}"

<responses-fields> ::= <response-field> | <response-field> "," <responses-fields>

<response-field> ::= '"default"' ":" <response-or-ref>
                   | <status-code> ":" <response-or-ref>
                   | <extension-field>

<status-code> ::= <string>  ; HTTP status code or pattern

; Response Object
<response-or-ref> ::= <response-object> | <reference-object>

<response-object> ::= "{" <response-fields> "}"

<response-fields> ::= <response-field-item> | <response-field-item> "," <response-fields>

<response-field-item> ::= '"description"' ":" <string>
                        | '"headers"' ":" <headers-object>
                        | '"content"' ":" <content-object>
                        | '"links"' ":" <links-object>
                        | <extension-field>

; Headers Object
<headers-object> ::= "{" <header-entries> "}" | "{" "}"

<header-entries> ::= <header-entry> | <header-entry> "," <header-entries>

<header-entry> ::= <string> ":" <header-or-ref>

<header-or-ref> ::= <header-object> | <reference-object>

<header-object> ::= "{" <header-fields> "}"

<header-fields> ::= <header-field> | <header-field> "," <header-fields>

<header-field> ::= '"description"' ":" <string>
                 | '"required"' ":" <boolean>
                 | '"deprecated"' ":" <boolean>
                 | '"style"' ":" '"simple"'
                 | '"explode"' ":" <boolean>
                 | '"schema"' ":" <schema-or-ref>
                 | '"example"' ":" <any-value>
                 | '"examples"' ":" <examples-object>
                 | '"content"' ":" <content-object>
                 | <extension-field>

; Schema Object
<schema-or-ref> ::= <schema-object> | <reference-object>

<schema-object> ::= "{" <schema-fields> "}" | "{" "}" | <boolean>

<schema-fields> ::= <schema-field> | <schema-field> "," <schema-fields>

<schema-field> ::= '"$id"' ":" <string>
                 | '"$schema"' ":" <string>
                 | '"$ref"' ":" <string>
                 | '"$defs"' ":" <schemas-object>
                 | '"type"' ":" <type-value>
                 | '"enum"' ":" <any-array>
                 | '"const"' ":" <any-value>
                 | '"multipleOf"' ":" <number>
                 | '"maximum"' ":" <number>
                 | '"exclusiveMaximum"' ":" <number>
                 | '"minimum"' ":" <number>
                 | '"exclusiveMinimum"' ":" <number>
                 | '"maxLength"' ":" <integer>
                 | '"minLength"' ":" <integer>
                 | '"pattern"' ":" <string>
                 | '"maxItems"' ":" <integer>
                 | '"minItems"' ":" <integer>
                 | '"uniqueItems"' ":" <boolean>
                 | '"maxProperties"' ":" <integer>
                 | '"minProperties"' ":" <integer>
                 | '"required"' ":" <string-array>
                 | '"properties"' ":" <schemas-object>
                 | '"patternProperties"' ":" <schemas-object>
                 | '"additionalProperties"' ":" <schema-or-boolean>
                 | '"items"' ":" <schema-or-ref>
                 | '"prefixItems"' ":" <schema-array>
                 | '"additionalItems"' ":" <schema-or-boolean>
                 | '"allOf"' ":" <schema-array>
                 | '"oneOf"' ":" <schema-array>
                 | '"anyOf"' ":" <schema-array>
                 | '"not"' ":" <schema-or-ref>
                 | '"format"' ":" <string>
                 | '"contentMediaType"' ":" <string>
                 | '"contentEncoding"' ":" <string>
                 | '"default"' ":" <any-value>
                 | '"title"' ":" <string>
                 | '"description"' ":" <string>
                 | '"deprecated"' ":" <boolean>
                 | '"readOnly"' ":" <boolean>
                 | '"writeOnly"' ":" <boolean>
                 | '"example"' ":" <any-value>
                 | '"examples"' ":" <any-array>
                 | '"discriminator"' ":" <discriminator-object>
                 | '"xml"' ":" <xml-object>
                 | '"externalDocs"' ":" <external-docs-object>
                 | <extension-field>

<type-value> ::= <string> | <string-array>

<schema-or-boolean> ::= <schema-or-ref> | <boolean>

<schemas-object> ::= "{" <schema-entries> "}" | "{" "}"

<schema-entries> ::= <schema-entry> | <schema-entry> "," <schema-entries>

<schema-entry> ::= <string> ":" <schema-or-ref>

<schema-array> ::= "[" <schema-list> "]" | "[" "]"

<schema-list> ::= <schema-or-ref> | <schema-or-ref> "," <schema-list>

; Discriminator Object
<discriminator-object> ::= "{" <discriminator-fields> "}"

<discriminator-fields> ::= <discriminator-field> | <discriminator-field> "," <discriminator-fields>

<discriminator-field> ::= '"propertyName"' ":" <string>
                        | '"mapping"' ":" <string-mapping-object>
                        | <extension-field>

; XML Object
<xml-object> ::= "{" <xml-fields> "}" | "{" "}"

<xml-fields> ::= <xml-field> | <xml-field> "," <xml-fields>

<xml-field> ::= '"name"' ":" <string>
              | '"namespace"' ":" <string>
              | '"prefix"' ":" <string>
              | '"attribute"' ":" <boolean>
              | '"wrapped"' ":" <boolean>
              | <extension-field>

; Security Scheme Object
<security-scheme-or-ref> ::= <security-scheme-object> | <reference-object>

<security-scheme-object> ::= "{" <security-scheme-fields> "}"

<security-scheme-fields> ::= <security-scheme-field> | <security-scheme-field> "," <security-scheme-fields>

<security-scheme-field> ::= '"type"' ":" <security-type>
                          | '"description"' ":" <string>
                          | '"name"' ":" <string>
                          | '"in"' ":" <api-key-location>
                          | '"scheme"' ":" <string>
                          | '"bearerFormat"' ":" <string>
                          | '"flows"' ":" <oauth-flows-object>
                          | '"openIdConnectUrl"' ":" <string>
                          | <extension-field>

<security-type> ::= '"apiKey"' | '"http"' | '"oauth2"' | '"openIdConnect"'

<api-key-location> ::= '"query"' | '"header"' | '"cookie"'

; OAuth Flows Object
<oauth-flows-object> ::= "{" <oauth-flows-fields> "}" | "{" "}"

<oauth-flows-fields> ::= <oauth-flows-field> | <oauth-flows-field> "," <oauth-flows-fields>

<oauth-flows-field> ::= '"implicit"' ":" <oauth-flow-object>
                      | '"password"' ":" <oauth-flow-object>
                      | '"clientCredentials"' ":" <oauth-flow-object>
                      | '"authorizationCode"' ":" <oauth-flow-object>
                      | <extension-field>

<oauth-flow-object> ::= "{" <oauth-flow-fields> "}"

<oauth-flow-fields> ::= <oauth-flow-field> | <oauth-flow-field> "," <oauth-flow-fields>

<oauth-flow-field> ::= '"authorizationUrl"' ":" <string>
                     | '"tokenUrl"' ":" <string>
                     | '"refreshUrl"' ":" <string>
                     | '"scopes"' ":" <string-mapping-object>
                     | <extension-field>

; Security Requirements
<security-requirements-array> ::= "[" <security-requirement-list> "]" | "[" "]"

<security-requirement-list> ::= <security-requirement-object> | <security-requirement-object> "," <security-requirement-list>

<security-requirement-object> ::= "{" <security-requirement-entries> "}" | "{" "}"

<security-requirement-entries> ::= <security-requirement-entry> | <security-requirement-entry> "," <security-requirement-entries>

<security-requirement-entry> ::= <string> ":" <string-array>

; Example Object
<examples-object> ::= "{" <example-entries> "}" | "{" "}"

<example-entries> ::= <example-entry> | <example-entry> "," <example-entries>

<example-entry> ::= <string> ":" <example-or-ref>

<example-or-ref> ::= <example-object> | <reference-object>

<example-object> ::= "{" <example-fields> "}" | "{" "}"

<example-fields> ::= <example-field> | <example-field> "," <example-fields>

<example-field> ::= '"summary"' ":" <string>
                  | '"description"' ":" <string>
                  | '"value"' ":" <any-value>
                  | '"externalValue"' ":" <string>
                  | <extension-field>

; Link Object
<links-object> ::= "{" <link-entries> "}" | "{" "}"

<link-entries> ::= <link-entry> | <link-entry> "," <link-entries>

<link-entry> ::= <string> ":" <link-or-ref>

<link-or-ref> ::= <link-object> | <reference-object>

<link-object> ::= "{" <link-fields> "}"

<link-fields> ::= <link-field> | <link-field> "," <link-fields>

<link-field> ::= '"operationRef"' ":" <string>
               | '"operationId"' ":" <string>
               | '"parameters"' ":" <link-parameters-object>
               | '"requestBody"' ":" <any-value>
               | '"description"' ":" <string>
               | '"server"' ":" <server-object>
               | <extension-field>

<link-parameters-object> ::= "{" <link-parameter-entries> "}" | "{" "}"

<link-parameter-entries> ::= <link-parameter-entry> | <link-parameter-entry> "," <link-parameter-entries>

<link-parameter-entry> ::= <string> ":" <link-parameter-value>

<link-parameter-value> ::= <any-value> | <runtime-expression>

<runtime-expression> ::= <string>  ; Runtime expression syntax

; Callback Object
<callbacks-object> ::= "{" <callback-entries> "}" | "{" "}"

<callback-entries> ::= <callback-entry> | <callback-entry> "," <callback-entries>

<callback-entry> ::= <string> ":" <callback-or-ref>

<callback-or-ref> ::= <callback-object> | <reference-object>

<callback-object> ::= "{" <callback-expression-entries> "}" | "{" "}"

<callback-expression-entries> ::= <callback-expression-entry> | <callback-expression-entry> "," <callback-expression-entries>

<callback-expression-entry> ::= <runtime-expression> ":" <path-item-object>

; Tag Object
<tags-array> ::= "[" <tag-list> "]" | "[" "]"

<tag-list> ::= <tag-object> | <tag-object> "," <tag-list>

<tag-object> ::= "{" <tag-fields> "}"

<tag-fields> ::= <tag-field> | <tag-field> "," <tag-fields>

<tag-field> ::= '"name"' ":" <string>
              | '"description"' ":" <string>
              | '"externalDocs"' ":" <external-docs-object>
              | <extension-field>

; Components Object
<components-object> ::= "{" <components-fields> "}" | "{" "}"

<components-fields> ::= <components-field> | <components-field> "," <components-fields>

<components-field> ::= '"schemas"' ":" <schemas-object>
                     | '"responses"' ":" <responses-components-object>
                     | '"parameters"' ":" <parameters-components-object>
                     | '"examples"' ":" <examples-components-object>
                     | '"requestBodies"' ":" <request-bodies-object>
                     | '"headers"' ":" <headers-components-object>
                     | '"securitySchemes"' ":" <security-schemes-object>
                     | '"links"' ":" <links-components-object>
                     | '"callbacks"' ":" <callbacks-components-object>
                     | '"pathItems"' ":" <path-items-object>
                     | <extension-field>

; Component collections
<responses-components-object> ::= "{" <response-component-entries> "}" | "{" "}"
<response-component-entries> ::= <response-component-entry> | <response-component-entry> "," <response-component-entries>
<response-component-entry> ::= <component-name> ":" <response-or-ref>

<parameters-components-object> ::= "{" <parameter-component-entries> "}" | "{" "}"
<parameter-component-entries> ::= <parameter-component-entry> | <parameter-component-entry> "," <parameter-component-entries>
<parameter-component-entry> ::= <component-name> ":" <parameter-or-ref>

<examples-components-object> ::= "{" <example-component-entries> "}" | "{" "}"
<example-component-entries> ::= <example-component-entry> | <example-component-entry> "," <example-component-entries>
<example-component-entry> ::= <component-name> ":" <example-or-ref>

<request-bodies-object> ::= "{" <request-body-component-entries> "}" | "{" "}"
<request-body-component-entries> ::= <request-body-component-entry> | <request-body-component-entry> "," <request-body-component-entries>
<request-body-component-entry> ::= <component-name> ":" <request-body-or-ref>

<headers-components-object> ::= "{" <header-component-entries> "}" | "{" "}"
<header-component-entries> ::= <header-component-entry> | <header-component-entry> "," <header-component-entries>
<header-component-entry> ::= <component-name> ":" <header-or-ref>

<security-schemes-object> ::= "{" <security-scheme-component-entries> "}" | "{" "}"
<security-scheme-component-entries> ::= <security-scheme-component-entry> | <security-scheme-component-entry> "," <security-scheme-component-entries>
<security-scheme-component-entry> ::= <component-name> ":" <security-scheme-or-ref>

<links-components-object> ::= "{" <link-component-entries> "}" | "{" "}"
<link-component-entries> ::= <link-component-entry> | <link-component-entry> "," <link-component-entries>
<link-component-entry> ::= <component-name> ":" <link-or-ref>

<callbacks-components-object> ::= "{" <callback-component-entries> "}" | "{" "}"
<callback-component-entries> ::= <callback-component-entry> | <callback-component-entry> "," <callback-component-entries>
<callback-component-entry> ::= <component-name> ":" <callback-or-ref>

<path-items-object> ::= "{" <path-item-component-entries> "}" | "{" "}"
<path-item-component-entries> ::= <path-item-component-entry> | <path-item-component-entry> "," <path-item-component-entries>
<path-item-component-entry> ::= <component-name> ":" <path-item-object>

; Webhooks Object
<webhooks-object> ::= "{" <webhook-entries> "}" | "{" "}"

<webhook-entries> ::= <webhook-entry> | <webhook-entry> "," <webhook-entries>

<webhook-entry> ::= <string> ":" <path-item-object>

; Reference Object
<reference-object> ::= "{" '"$ref"' ":" <string> "}"

; Extension fields
<extension-field> ::= <extension-name> ":" <any-value>

<extension-name> ::= <string>  ; Must start with "x-"

; Common structures
<component-name> ::= <string>  ; Must match ^[a-zA-Z0-9\.\-_]+$

<string-array> ::= "[" <string-list> "]" | "[" "]"
<string-list> ::= <string> | <string> "," <string-list>

<any-array> ::= "[" <any-value-list> "]" | "[" "]"
<any-value-list> ::= <any-value> | <any-value> "," <any-value-list>

<string-mapping-object> ::= "{" <string-mapping-entries> "}" | "{" "}"
<string-mapping-entries> ::= <string-mapping-entry> | <string-mapping-entry> "," <string-mapping-entries>
<string-mapping-entry> ::= <string> ":" <string>

; Primitive values
<any-value> ::= <string> | <number> | <integer> | <boolean> | <null> | <object> | <any-array>

<object> ::= "{" <object-fields> "}" | "{" "}"
<object-fields> ::= <object-field> | <object-field> "," <object-fields>
<object-field> ::= <string> ":" <any-value>

; Terminals
<string> ::= '"' <characters> '"'
<characters> ::= <character> | <character> <characters> | ε
<character> ::= <any-unicode-character-except-quote-or-backslash> | <escape-sequence>
<escape-sequence> ::= '\' <escaped-character>
<escaped-character> ::= '"' | '\' | '/' | 'b' | 'f' | 'n' | 'r' | 't' | 'u' <hex-digit> <hex-digit> <hex-digit> <hex-digit>

<number> ::= <integer> <fraction> <exponent> | <integer> <fraction> | <integer> <exponent> | <integer>
<integer> ::= <digit> | <onenine> <digits> | '-' <digit> | '-' <onenine> <digits>
<fraction> ::= '.' <digits>
<exponent> ::= <e> <sign> <digits> | <e> <digits>
<sign> ::= '+' | '-'
<e> ::= 'e' | 'E'

<boolean> ::= "true" | "false"
<null> ::= "null"

<digits> ::= <digit> | <digit> <digits>
<digit> ::= '0' | <onenine>
<onenine> ::= '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
<hex-digit> ::= <digit> | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

; ε represents an empty string
```

## BNF記法の説明

この BNF（Backus-Naur Form）記法では：

1. **非終端記号**：`<>` で囲まれた要素（例：`<openapi-object>`）
2. **終端記号**：引用符で囲まれた文字列（例：`"openapi"`）
3. **定義**：`::=` で表現
4. **選択**：`|` で表現（OR）
5. **連結**：空白で表現（AND）
6. **空文字列**：`ε` で表現

## 主要な特徴

1. **階層構造**：OpenAPI文書の階層的な構造を正確に表現
2. **必須/任意フィールド**：空のオブジェクト（`"{" "}"`）を許可することで任意フィールドを表現
3. **型安全性**：各フィールドの値の型を厳密に定義
4. **拡張性**：`<extension-field>` により `x-` で始まる拡張フィールドをサポート
5. **参照機能**：`<reference-object>` により `$ref` による参照をサポート

この BNF 記法により、OpenAPI 3.1 仕様の構文を形式的かつ厳密に定義しています。
