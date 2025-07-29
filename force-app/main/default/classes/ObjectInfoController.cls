public with sharing class ObjectInfoController {

// —————————————— 1. Return objects as displayed in the Object Manager ——————————————
@AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAllObjectsWithIcons() {
        List<Map<String, String>> res = new List<Map<String, String>>();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
    
        List<String> bannedSuffixes = new List<String>{
            'Relation', 'ProcessInstance', 'ProcessInstanceStep', 'Feed', 'FeedComment', 'FeedTrackedChange',
            'FeedSignal', 'History', 'FieldHistory', 'FieldHistoryArchive', 'Archive', 'Share', 'Sharing',
            'Tag', 'TagMember', 'ChangeEvent', 'DuplicateRule', 'DuplicateRecordItem', 'CleanInfo',
            'UserRecordAccess', 'EntitySubscription', '__x'
        };
    
        Set<String> blacklist = new Set<String>{
            'UserRecordAccess', 'EntitySubscription', 'PartnerRole', 'CollaborationGroupMemberRequest'
        };
    
        for (String objApi : gd.keySet()) {
            Schema.SObjectType objType = gd.get(objApi);
            Schema.DescribeSObjectResult d = objType.getDescribe();
    
            if (
                d.isQueryable() &&
                d.isAccessible() &&
                !d.isCustomSetting() &&
                !d.isDeprecatedAndHidden() &&
                d.isCreateable() &&
                d.isUpdateable() &&
                d.isDeletable() &&
                d.isSearchable()
            ) {
                Boolean banned = false;
                for (String ban : bannedSuffixes) {
                    if (objApi.endsWith(ban)) {
                        banned = true;
                        break;
                    }
                }
                if (banned) continue;
                if (blacklist.contains(objApi)) continue;
    
                Map<String, String> item = new Map<String, String>{
                    'label'   => d.getLabel(),
                    'apiName' => objApi,
                    'iconUrl' => '/img/icon/t4/' + (d.getKeyPrefix() != null ? d.getName().toLowerCase() : 'custom') + '.png'
                };
                res.add(item);
            }
        }
    
// Apex-compliant sorting by label
List<String> labels = new List<String>();
        Map<String, Map<String, String>> labelToMap = new Map<String, Map<String, String>>();
        for (Map<String, String> m : res) {
            String label = m.get('label');
            labels.add(label);
            labelToMap.put(label, m);
        }
        labels.sort();
    
        List<Map<String, String>> sortedRes = new List<Map<String, String>>();
        for (String label : labels) {
            sortedRes.add(labelToMap.get(label));
        }
        return sortedRes;
    }

// —————————————— 2. Return fields and their references ——————————————
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

// —————————————— 3. Return reference field targets ——————————————
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
