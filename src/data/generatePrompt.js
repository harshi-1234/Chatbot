export const generateFinalPrompt = ({
    isExistingAttribute,
    attributeName,
    namespace,
    schema,
    imsAttrName,
    onboardToDPP,
    onboardToDigiCat,
    productGroup
  }) => {
    let prompt = `For the below given steps understand the requirements and generate code for each steps\n`;
  
    if (isExistingAttribute === 'yes') {
      prompt += `1. If yes\n\t1. Allowlist the attribute for the given namespace - ${namespace}. User needs to modify this file https://code.amazon.com/packages/DigitalPublishingTypes/blobs/mainline/--/repository/attribute-schema/com/amazon/ingestion/${namespace}/item.ion\n`;
    } else {
    //   prompt += `2. If no\n`;
      prompt += `\t1.1 Create new attribute named - ${attributeName}. Give code with file path.\n`;
      prompt += `\t1.2 Schema for the given file is - ${schema}\n`;
      prompt += `\t1.3 Add forward and reverse transformations for the ${attributeName}. Give code with file path.\n`;
      prompt += `\t1.4 Allowlist the attribute for the given namespace - ${namespace}. User needs to modify this file https://code.amazon.com/packages/DigitalPublishingTypes/blobs/mainline/--/repository/attribute-schema/com/amazon/ingestion/${namespace}/item.ion\n`;
    }
  
    prompt += `2. For the given IMS attribute - ${imsAttrName} add the transformations logic. User need to use this package DigitalPublishingRules${productGroup}. For the generated code also create test files. Give code with file path.\n`;
  console.log(onboardToDPP, onboardToDigiCat, schema, attributeName)
    if (onboardToDPP === 'yes') {
      prompt += `3. Onboard this attribute - ${attributeName} to DPP 1.0. Give code with file path.\n`;
    }
  
    if (onboardToDigiCat === 'yes') {
      prompt += `4. Onboard this attribute - ${attributeName} to DigiCat. Give code with file path.\n`;
    }
  
    return prompt;
  };
  