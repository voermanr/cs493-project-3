#!/bin/bash

# Set the base URL
SERVER_URL=http://localhost:6969
NUM_TESTS=0
NUM_PASSED=0

# Function to perform a test and display status
perform_test() {
    local test_name="$1"
    local expected_response="$2"
    local response=$(curl -s -X "$3" -H 'Content-Type: application/json' -d "$4" "$SERVER_URL$5")

    NUM_TESTS=$((NUM_TESTS+1))

    printf "\n=====================================================\n"
    printf "Test: %s\n" "$test_name"
    printf -- "-----------------------------------------------------\n"
    printf "Expected Response: %s\n" "$expected_response"
    printf -- "-----------------------------------------------------\n"
    printf "Actual Response: %s\n" "$response"
    printf "=====================================================\n"

    if [[ "$response" == *"$expected_response"* ]]; then
        printf "\033[1;32m%s\033[0m\n" "Test Passed!"
        NUM_PASSED=$((NUM_PASSED+1))
    else
        printf "\033[1;31m%s\033[0m\n" "Test Failed!"
    fi
}

post_business() {
    local id="$1"
    local name="$2"
    local city="$3"
    local state="$4"
    local zip="$5"
    local street_address="$6"
    local phone_number="$7"
    local category="$8"
    local subcategory="$9"

    # Construct the JSON data
    local data='{
        "_id": "'"$id"'",
        "name": "'"$name"'",
        "city": "'"$city"'",
        "state": "'"$state"'",
        "zip": "'"$zip"'",
        "street_address": "'"$street_address"'",
        "phone_number": "'"$phone_number"'",
        "category": "'"$category"'",
        "subcategory": "'"$subcategory"'"
    }'

    # POST the new business
    local output=$(curl -X POST -s \
        -H 'Content-Type: application/json' \
        -d "$data" \
        "$SURL/businesses/")
}


# Test: POST a new business
test_post_business() {
    local test_name="POST a new business"
    local expected_response='"id":"0","links":{"business":"/businesses/0"}'
    local method="POST"
    local data='{"_id":"0", "ownerid":"0", "name":"Bobs Burgers", "city":"Bobtown", "state":"PN", "zip":"12700", "address":"420", "phone":"867-5309", "category":"burgerstand", "subcategory":"with_fries"}'
    perform_test "$test_name" "$expected_response" "$method" "$data" "/businesses/"
}

# Test: fail to POST a business without name or zip
test_fail_post_business() {
    local test_name="Fail to POST a new business without name or zip"
    local expected_response='"error":"Request body is not a valid business object"'
    local method="POST"
    local data='{"city":"Bobtown", "state":"PN", "address":"420", "phone":"867-5309", "category":"burgerstand", "subcategory":"with_fries"}'
    perform_test "$test_name" "$expected_response" "$method" "$data" "/businesses/"
}

# GET a business
test_get_a_business() {
  local test_name="GET a business"
  local expected_response=''
  local method="GET"
  local data=''

  post_business "1" "bobtown"
  perform_test "$test_name" "$expected_response" "$method" "$data" "/businesses/0"
}

# Add more test functions as needed...

# Run tests
test_post_business
test_fail_post_business
test_get_a_business
# Call other test functions here...



# Add summary
printf "\n=====================================================\n"
printf "Summary:\n"
printf -- "-----------------------------------------------------\n"
printf "Total tests: %d\n" "$((NUM_TESTS))"
printf "Passed: %d\n" "$((NUM_PASSED))"
printf "Failed: %d\n" "$((NUM_TESTS - NUM_PASSED))"
printf "=====================================================\n"