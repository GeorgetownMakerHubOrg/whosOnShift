
var currentUser = "";
var reservationCalName = "Georgetown Maker Hub Equipment Reservations";
var reservationCal = false;
var staffScheduleCalName = "Maker Hub Staff and Volunteer Schedule";
var staffScheduleCal = false;
var staffConsultationCalName = "Georgetown Maker Hub Staff Consultation Calendar";
var staffConsultationCal = false;

var staffChecklistId = "1pIXC9_202q1gl6InGSDpfrXaddvjG4Or0El1eYwW7CM";
var signinFormId = "1mxt8N1dVohK5alXzmTxQKnzOTioz_dwyxbc2MSgDwBU";
var iHelpedSomeoneId = "120F1E_ckvxBWKPNHS9Ia9mXSdRuefnEasR7zKqT1dSk";
var meritBadgeIconListId= "10Whhc_Ps_G7z5IqOHXezTQNdDPON6fNiC0i-VrgHKXc";

var meritBadgeIconList = SpreadsheetApp
        .openById(meritBadgeIconListId);

var staffChecklist = SpreadsheetApp
        .openById(staffChecklistId);

var signIn = SpreadsheetApp
        .openById(signinFormId);

var iHelpedSomeone = SpreadsheetApp
        .openById(iHelpedSomeoneId);





function doGet(e) {
  Logger.log("opening");  
  parameter = e.parameter;
  var page= e.parameter.page;
  if(!page){
    page = 'index';
  }
     return HtmlService
     .createTemplateFromFile(page)
    // .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
     .evaluate();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

// get Calendars 
function getReservationCal(){
  if(!reservationCal){
    var calendars = CalendarApp.getCalendarsByName(reservationCalName);
    reservationCal = calendars[0];
  }
  return reservationCal;
}

function getStaffScheduleCal(){
  if(!staffScheduleCal){
    var calendars = CalendarApp.getCalendarsByName(staffScheduleCalName);
    staffScheduleCal = calendars[0];
  }
  return staffScheduleCal;
}


function getStaffConsultationCal(){
  //staffConsultationCalName
  if(!staffConsultationCal){
    var calendars = CalendarApp.getCalendarsByName(staffConsultationCalName);
    staffConsultationCal = calendars[0];
  }
  return staffConsultationCal;
}
/////////////////////////


// Get Events
function getEquipmentReservationEvents(startTime, endTime){
  var cal = getReservationCal();
  return getCalEvents(cal, startTime, endTime);
}

function getStaffScheduleEvents(startTime, endTime){
  var cal = getStaffScheduleCal();
  return getCalEvents(cal, startTime, endTime);  
}

function getStaffConsultationEvents(startTime, endTime){
  var cal = getStaffConsultationCal();
  return getCalEvents(cal, startTime, endTime);    
}

function getCalEvents(cal, startTime, endTime){
  var realStartDate = new Date(startTime);
  var realEndDate = new Date(endTime);
  try{
    var events = cal.getEvents(new Date(startTime), new Date(endTime));
    var returnEvents = events.map(function(event){
      Logger.log(JSON.stringify(event));
      var returnEvent = {
        id: event.getId(),
        calendarName : cal.getName(),
        startTime: event.getStartTime().toString(),
        endTime : event.getEndTime().toString(),
        title : event.getTitle(),
        description : event.getDescription(),
        guestList : event.getGuestList(true).map(function(guest){
          return {name : guest.getName(),
                  email : guest.getEmail().toLowerCase(),
                  status: guest.getGuestStatus()
                 };
        }),
        creators : event.getCreators(),
        dateCreated : event.getDateCreated.toString(),
        location : event.getLocation()
      }
      return returnEvent;
    });
    return returnEvents;
  }catch (error){
    Logger.log(error);
    throw error; 
  }
}
/////////////////////


/// Create Events
function createCalEvent(cal, startTime, endTime, title, description, guests){
   
  var guestlist = "";
  if(guests){
    var guestEmails = guests.map(function(g){
      if(g.indexOf("@") < 0){
        return g.toLowerCase()+"@georgetown.edu";
      }
    });
    guestlist = guestEmails.join(",");
  }
  
  var options = {
    location: "Maker Hub",
    description: description,
    guests : guestlist
  };
  
  var startDate = new Date(startTime);
  var endDate = new Date(endTime);  
  var event = cal.createEvent(title, new Date(startTime), new Date(endTime), options)

  var returnEvent = {
        id: event.getId(),
        startTime: event.getStartTime().toString(),
        endTime : event.getEndTime().toString(),
        title : event.getTitle(),
        description : event.getDescription(),
        guestList : event.getGuestList(true).map(function(guest){
          return {name : guest.getName(),
                  email : guest.getEmail().toLowerCase(),
                  status: guest.getGuestStatus()
                 };
        }),
        creators : event.getCreators(),
        dateCreated : event.getDateCreated.toString(),
        location : event.getLocation()
      }
  return returnEvent;
}

function createReservationEvent(startTime, endTime, title, description, guests){
  var cal = getReservationCal();
  return createCalEvent(cal, startTime, endTime, title, description, guests);
}

function createStaffConsultationEvent(startTime, endTime, title, description, guests){
  var cal = getStaffConsultationCal();
  return createCalEvent(cal, startTime, endTime, title, description, guests);
}
///////////////////////



///// Get Current User informations
function getNetId() {
  var email = Session.getActiveUser().getEmail();
  Logger.log(email);
  var user = "";
  if(email.trim() != ""){
    user = email.split("@")[0];
  }
  return user.toLowerCase();
}


////  Get Staff Informations
function getStaffChecklist(filter, sort){
  var stafflist = {};
  var allStaffData = staffChecklist
  .getActiveSheet()
  .getDataRange()
  .getValues();
 
  var checklistData = dataIntoHashRows(allStaffData, 1, 2); //, function(row){ return row['NetId'] == netId;}).data;  
  
  stafflist.checklistData = checklistData;
  
  return stafflist;
}

function getStaffSchedules(startDate, endDate){

  var staffCal = getStaffScheduleCal();
  var staffSchedules = {};
  
  var now = new Date();
  var startDateTime = new Date(startDate);
  var endDateTime = new Date(endDate);
  var events = staffCal.getEvents(startDateTime, endDateTime);  
  Logger.log("got them");
  Logger.log(JSON.stringify(events, null, " "));
  
  for(var i = 0; i < events.length; i++){
    var guests = events[i].getGuestList(true);
    for(var j = 0; j < guests.length; j++){
      var guest = guests[j];
      var email  = guest.getEmail().toLowerCase();
      var eventDetails = {title: events[i].getTitle(),
                          startTime: events[i].getStartTime(),
                          endTime: events[i].getEndTime(),
                          guestList : events[i].getGuestList(),
                          staffEmail : events[i].getGuestList()[0].toString(),
                          id : events[i].getId()
                         };
      if(!staffSchedules[email]){
        staffSchedules[email] = [];
      }
      staffSchedules[email].push(eventDetails);
    }    
  }
  return JSON.parse(JSON.stringify(staffSchedules));
}



function getStaffOnShift(startTime, endTime, currentTime){
  // find staff that have shifts at this time
  
  
  var staffSchedules = getStaffSchedules(startTime, endTime);
  
  return staffSchedules;
  
}

function getStaffLatestCheckins(){
  // get most recent staff checkins.
  return {};
}

function getStaffData(netId){
  var staffData = {foo:"va"};

  var allStaffData = staffChecklist
  .getActiveSheet()
  .getDataRange()
  .getValues();
  

  var checklistData = dataIntoHashRows(allStaffData, 1, 2, function(row){
    if(row["NetId"].match(new RegExp(netId, "i"))){
      return true;
    }
    return false;
  }); //, function(row){ return row['NetId'] == netId;}).data;
  checklistData.data = checklistData.data[0];
  
 
   staffData.checklistData = JSON.parse(JSON.stringify(checklistData));
   return staffData;
}



/// Get Merit Badge Information
function getMeritBadgeIconList(filter, sort){

  var allmeritBadgeIconData = meritBadgeIconList
  .getActiveSheet()
  .getDataRange()
  .getValues();
 
  var meritbadgeiconlist = dataIntoHashRows(allmeritBadgeIconData, 0, 1).data; //, function(row){ return row['NetId'] == netId;}).data;  
  var meritBadgeIconHash = {};
  for (var i = 0; i < meritbadgeiconlist.length; i++){
   meritBadgeIconHash[meritbadgeiconlist[i]["Badge Name"]] = meritbadgeiconlist[i];
  }  
  var meritBadgeHash = {};
  for (var j = 0; j < MeritBadges.length; j++){
    if(meritBadgeIconHash[MeritBadges[j]]){
      meritBadgeHash[MeritBadges[j]] = meritBadgeIconHash[MeritBadges[j]];
    }else{
      meritBadgeHash[MeritBadges[j]] = {};
    }
  }
  return meritBadgeHash;
}

function getEquipmentList(){
 return equipmentList; 
}

function getOpenHours(){
  return openHours; 
}


////// clever bits for scheduling




///// Utility Functions
function dataIntoHashRows(data, keysRow, startRow, filterFunction){
  var idKey= {};
  var keyId= {};
  var newData = [];
  Logger.log("data");

  for (var k = 0; k < data[keysRow].length; k++) { 
    var key = data[keysRow][k];
    key = key.replace("?","");
    key = key.replace("'","");
    key = key.replace(":","");
    if(key.trim() == ""){
       continue;
    }
    
    idKey[k] = key;
    keyId[key] = k;
  }
    
  for (var i = startRow; i < data.length; i++) { 
    var newRow = {};
    for (var j = 0; j < data[i].length; j++) { 
      if(!idKey[j] || idKey[j].trim() == ""){
        continue; 
      }
      newRow[idKey[j]] = data[i][j];
    }
    if(!filterFunction || filterFunction(newRow) == true){
      newData.push(newRow);
    }
  }
  
  return {data:newData, keyId: keyId, idKey: idKey};
  
}



/////////////// get equipment and merit badge information


// lists of things:

var openHouse = {
  "Monday" : {
    open : "12:00",
    close : "17:00",
  },
  "Tuesday" : {
    open : "17:00",
    close : "20:00",
  },
  "Wednesday" : {
    open : "17:00",
    close : "20:00",
  },
  "Thursday" : {
    open : "17:00",
    close : "20:00",
  },
  "Friday" : {
    open : "12:00",
    close : "17:00",
  },
  "Saturday" : {
    open : "12:00",
    close : "17:00",
  }
};

var MeritBadges = [
  'Laser Cutter',
  '3D Printing',	
  'Hand Tools',	
  'HandiBot',	
  'Power Tools',
  'Print Shop',	
  'Sewing Machine',
  'Embroidery Machine',	
  'Vinyl Cutter',
  'FormLabs',	
  'Soldering',
  'Arduino',
  'Button Maker',
  'Raspberry Pi'
];


var equipmentList = {
  "FDM 3D Printer" : {
    meritBadge : "3D Printing",
    items : {
        "MakerBot 1" : {},
        "MakerBot 2" : {},
        "Ultimaker 2+" : {},
        "Taz 6 FlexyDually" : {},
        "MonoPrice Selecct" : {}        
    }
  },
  "SLA 3D Printer" : {
    meritBadge : "FormLabs",
    items : {
      "Form2 Resin Printer" : {}
    }
  },
  "Vinyl Cutter" : {
    meritBadge : "Vinyl Cutter",
    items : {
      "Silhouette 1" : {},
      "Silhouette 2" : {},
    }
  },
  "Laser Cutter" : {
    meritBadge : "Laser Cutter",
    requiresFullSupervision : true,
    items : {
      "VLS 4.60 Laser Cutter" : {}
    }
  },
  "Sewing Machine" : {
    meritBadge : "Sewing Machine",
    items : {
      "Janome HD 3000" : {}, 
    }    
  },
  "Embroidery Machine" : {
    meritBadge : "Embroidery Machine",
    items : {
      "Brother PE-770 Embroidery Machine" : {} 
    }
  },
  "Button Maker" : {
    meritBadge : "Button Maker",
    items : {
      "1 inch Button Maker" : {}, 
      "1.5 inch Button Maker" : {}, 
      "2.25 inch Button Maker" : {}, 
    }
  }
}


