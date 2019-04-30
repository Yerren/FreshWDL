import re

def processDict(txtIn):
    din = open(txtIn, 'r', encoding='utf-8')
    context = din.read()
    context = re.sub(r"[\t\r\n]+", "", context, flags=re.UNICODE)
    context = re.sub(r"(\s\s)+", "", context, flags=re.UNICODE)
    context = context[context.index("{") + 1:]
    context = context.split("}")
    context = context[:-2]

    titles = {}
    for i in range(len(context)):
        titles.update({context[i][:context[i].index("{")].strip(): context[i][context[i].index("{") + 1:]})

    try:
        fullDict = {}
        for pair in titles:
            if pair[0] == ",":
                pair1 = pair[1:]
            else:
                pair1 = pair

            tempLang = {}
            splittedSection = titles[pair].split("\",")
            for item in splittedSection:
                translation = item[item.index(":") + 1:]
                if translation[-1] != "\"":
                    translation = translation + "\""
                tempLang.update({item[:item.index(":")]: translation})

                if translation.count("\"") != 2:
                    print(str(txtIn) + " has a possible Error In: " + str(item[:item.index(":")]) + str(translation) + " (in " + str(pair1) + ")")

            fullDict.update({pair1: tempLang})
    except:
        print(str(txtIn) + " ERROR IN: " + str(item))

    return fullDict

# newDict = {"t1" : {"en" : "One", "nl" : "een", "es" : "uno", "n" : "n1"}, "t2" : {"en" : "Two", "nl" : "twee", "es" : "dos", "n" : "n2"}, "t3" : {"nl" : "dree", "es" : "tres", "n" : "n3"}}
# oldDict ={"t1" : {"en" : "One", "nl" : "een", "es" : "uno"}, "t2" : {"en" : "two", "nl" : "twee", "es" : "dos"}, "t3" : {"en" : "three", "nl" : "dree", "es" : "tres"}}

newDict = processDict("DictionaryNew.txt")
oldDict = processDict("DictionaryOld.txt")

for title in newDict:
    for lang in newDict[title]:
        if lang not in oldDict[title]:
            oldDict[title].update({lang: str(newDict[title][lang])})
            print("Added: " + str(lang) + ": " +  str(newDict[title][lang]) + " to " + str(title))
        else:
            if newDict[title][lang] == oldDict[title][lang]:
                pass
            else:
                answer = input("(" + str(lang) + ") Do you want to update from: " + str(oldDict[title][lang]) + "(old) to: " + str(newDict[title][lang]) + "(new)? [Y/n]")
                if answer == "n":
                    pass
                else:
                    oldDict[title][lang] = newDict[title][lang]

f = open("outputDict.txt", "w+", encoding='utf-8')

f.write("var dict = {\n")
outputFinal = ""
for title in oldDict:
    outputFinal += "\t" + title + " {\n"
    output = ""
    for lang in oldDict[title]:
        output += "\t\t" + str(lang) + ":" + str(oldDict[title][lang]) + ",\n"
    outputFinal += output[:-2] + "\n" + "\t},\n"
f.write(outputFinal[:-2] + "\n")
f.write("};")
