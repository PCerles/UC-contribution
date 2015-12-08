import csv
import json
with open('taxdata_curated.csv', 'rU') as csvfile:
	reader = csv.reader(csvfile)
	j = 0
	a = []
	year = ''
	obj = []
	amounts = []
	for row in reader:
		if j % 2 == 0:
			year = row[0]
			amounts = []
			for i in range(1, len(row)):
				if row[i] != "":
					amounts.append(row[i])
		else:
			for i in range(len(amounts)):
				bracket = {};
				bracket['cutoff'] = amounts[i];
				bracket['taxrate'] = row[i + 1];
				obj.append(bracket)
			a.append({'year': year, 'tax': obj})
			obj = []
		j+=1
	with open('data.txt', 'w') as outfile:
		json.dump(a, outfile)
