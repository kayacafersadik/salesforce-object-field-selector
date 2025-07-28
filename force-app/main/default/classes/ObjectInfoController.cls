// force-app/main/default/classes/ObjectInfoController.cls
public with sharing class ObjectInfoController {
    @AuraEnabled(cacheable=true)
    public static Map<String, List<Map<String, Object>>> getObjectsAndFields(List<String> objectApiNames) {
        Map<String, List<Map<String, Object>>> res = new Map<String, List<Map<String, Object>>>();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        for (String objName : objectApiNames) {
            Schema.SObjectType objType = gd.get(objName);
            if (objType == null) continue;
            Schema.DescribeSObjectResult objDesc = objType.getDescribe();

            List<Map<String, Object>> fields = new List<Map<String, Object>>();
            for (Schema.SObjectField f : objDesc.fields.getMap().values()) {
                Schema.DescribeFieldResult fd = f.getDescribe();
                List<String> referenceToList = new List<String>();
                String relationshipName = null;
                if (fd.getType() == Schema.DisplayType.REFERENCE) {
                    for (Schema.SObjectType st : fd.getReferenceTo()) {
                        referenceToList.add(st.getDescribe().getName());
                    }
                    relationshipName = fd.getRelationshipName();
                }
                fields.add(new Map<String, Object>{
                    'label'       => (relationshipName != null ? relationshipName : fd.getName()),
                    'apiName'     => fd.getName(),
                    'type'        => String.valueOf(fd.getType()),
                    'referenceTo' => referenceToList
                });
            }
            res.put(objName, fields);
        }
        return res;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getReferenceTargets(String objectApiName, String referenceFieldName) {
        Schema.SObjectType sObj = Schema.getGlobalDescribe().get(objectApiName);
        if (sObj == null) return new List<String>();
        Schema.DescribeFieldResult dfr = sObj.getDescribe()
                                             .fields.getMap()
                                             .get(referenceFieldName)
                                             .getDescribe();
        List<String> targets = new List<String>();
        for (Schema.SObjectType t : dfr.getReferenceTo()) {
            targets.add(t.getDescribe().getName());
        }
        return targets;
    }
}
