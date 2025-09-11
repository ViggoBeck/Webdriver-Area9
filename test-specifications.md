# Area9 Performance Test Specifications

## Test Overview
This document contains the comprehensive test specifications for performance testing of the Area9 learning platform across different user roles and functionalities.

## Test Cases

### Login Tests

#### (*) Login Learner
- **Role**: Learner
- **Test Steps**:
	1. Open base URL for learner with skin
	2. Enter credentials
	3. Click login (Start timing)
	4. Note timing when you can see the dashboard
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
	- User: A9-106821@area9.dk
- **Expected Timing**: Average time: 8.4 sec

#### (*) Login Educator
- **Role**: Educator
- **Test Steps**:
	1. Open base URL for Educator with skin
	2. Enter credentials
	3. Click login (Start timing)
	4. Note timing when you can see the dashboard
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
	- User: A9-106816@area9.dk
- **Expected Timing**: 14.5 sec

#### (*) Login Curator
- **Role**: Curator
- **Test Steps**:
	1. Open base URL for Curator with skin
	2. Enter credentials
	3. Click login (Start timing)
	4. Note timing when you can see the dashboard
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
	- User: A9-106810@area9.dk
- **Expected Timing**: 12 sec

### Communicator Tests

#### (*) Communicator Loading time Learner
- **Role**: Learner
- **Test Steps**:
	1. Open Communicator URL for learner with skin
	2. Enter credentials
	3. Click login (Start timing)
	4. Wait until you can see communicator UI
	5. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication&folderIds=[Inbox]
- **Expected Timing**: 9.1 sec

#### (*) Communicator Loading time Educator
- **Role**: Educator
- **Test Steps**:
	1. Open Communicator URL for educator with skin
	2. Enter credentials
	3. Click login (Start timing)
	4. Wait until you can see communicator UI
	5. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication
- **Expected Timing**: 17.2 sec

### Content and Navigation Tests

#### Open Review
- **Role**: Educator
- **Test Steps**:
	1. Open URL for educator with skin
	2. Enter credentials
	3. Click login
	4. Go to the "Reviews" tab (Start timing)
	5. Wait until you see the reviews
	6. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=classcontent
	- Class: Benchmark Test 2 Do not touch
- **Expected Timing**: 3.8 sec

#### Open SCORM
- **Role**: Learner
- **Test Steps**:
	1. On a learner that is already logged in click on SCORM class on dashboard (Start timing)
	2. Wait until you can see SCORM file
	3. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
- **Expected Timing**: 8 seconds

#### Open Video Probe
- **Role**: Learner
- **Test Steps**:
	1. On a learner that is already logged in click on Video class on dashboard (Start timing)
	2. Wait until you can see Video file
	3. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
- **Expected Timing**: 5 seconds

#### (*) Open Course catalog
- **Role**: Learner
- **Test Steps**:
	1. On a learner that is already logged in click on course catalog (Start timing)
	2. Wait until you see content
	3. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
- **Expected Timing**: 1 second

### Analytics Tests

#### Analytics Educator
- **Role**: Educator
- **Test Steps**:
	1. Open URL for educator with skin
	2. Enter credentials
	3. Click login
	4. Scroll down to activity log
	5. Click learner and Select all learner, and click apply filter (Start timing)
	6. Wait until it is loaded
	7. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=analytics
	- Class: Benchmark Test 2 Do not touch
- **Expected Timing**: 13 Seconds

#### Analytics Curator - Unique Users Report
- **Role**: Curator
- **Test Steps**:
	1. On a curator that is already logged click on analytics
	2. Click on report and choose Unique users (Start timing)
	3. Wait until it is loaded
	4. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
	- Report: Unique users
- **Expected Timing**: 5 seconds

#### Analytics Curator - Project Team Activity
- **Role**: Curator
- **Test Steps**:
	1. On a curator that is already logged click on analytics
	2. Click on report and choose Project Team activity
	3. Choose project team (Start timing)
	4. Wait until it is loaded
	5. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
	- Report: Project Team activity
	- Project team: Benchmark Test BR
- **Expected Timing**: 5 seconds

### Class Management Tests

#### Open Class
- **Role**: Educator
- **Test Steps**:
	1. On an educator that is already logged in click on a class (Start timing)
	2. Wait until it is opened
	3. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
	- User: a9-106817@area9.dk
	- Classname: Benchmark Test 1 Do not touch
- **Expected Timing**: 8 seconds

#### Create Class
- **Role**: Educator
- **Test Steps**:
	1. On an educator that is already logged in create a class (Start timing)
	2. Wait until class is created
	3. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
- **Expected Timing**: 2.5 Seconds

#### Delete Class
- **Role**: Educator
- **Test Steps**:
	1. On an educator that is already logged in delete a class (Start timing)
	2. Wait until class is deleted
	3. Note timing
- **Additional Info**:
	- Link: https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
- **Expected Timing**: 1 Second

## Notes
- Tests marked with (*) indicate priority tests for initial implementation
- All timing measurements should be taken from the specified start point to the completion criteria
- URLs include skin parameter: `?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc`
- Tests are performed on UAT environment: `br.uat.sg.rhapsode.com`

## User Credentials

### **Learner Accounts**
- A9-106821@area9.dk
- A9-106822@area9.dk
- A9-106823@area9.dk
- A9-106824@area9.dk
- A9-106825@area9.dk
- A9-106826@area9.dk
- A9-106827@area9.dk
- A9-106828@area9.dk
- A9-106829@area9.dk
- A9-106830@area9.dk

### **Educator Accounts**
- A9-106816@area9.dk
- A9-106817@area9.dk
- A9-106818@area9.dk
- A9-106819@area9.dk
- A9-106820@area9.dk

### **Curator Accounts**
- A9-106810@area9.dk
- A9-106811@area9.dk
- A9-106812@area9.dk
- A9-106813@area9.dk
- a9-106814@area9.dk
- A9-106815@area9.dk

### **Default Password**
- **Password**: P@ssw0rd1234 (for all accounts)

### **Account Usage Notes**
- Multiple accounts per role allow for parallel testing without conflicts
- Can be used for load testing scenarios
- Useful for testing different user states or permissions