import json
import sys
import os


# 请根据实际情况修改相对路径
JSON_FILE_PATH = 'image.json' 


def dict_raise_on_duplicates(ordered_pairs):
    d = {}
    for k, v in ordered_pairs:
        if k in d:
            print(f"::error file={JSON_FILE_PATH},title=Duplicate Key::发现重复的 Key (唯一ID): '{k}'")
            sys.exit(1)
        d[k] = v
    return d

def validate():
    if not os.path.exists(JSON_FILE_PATH):
        print(f"::error::找不到文件 {JSON_FILE_PATH}")
        sys.exit(1)

    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            json.load(f, object_pairs_hook=dict_raise_on_duplicates)
        print("✅ 校验通过：JSON 格式正确且无重复 Key。")
        sys.exit(0)

    except Exception as e:
        print(f"::error::JSON 解析错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    validate()